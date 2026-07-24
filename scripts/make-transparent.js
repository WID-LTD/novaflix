const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const publicDir = path.resolve(__dirname, '..', 'client', 'public')

const logos = [
  'logo-combination-mark.png',
  'logo-letter-mark.png',
  'logo-nova.png',
  'logo-flix.png',
  'logo-pictoral-mark.png',
]

function readPng(filePath) {
  const buf = fs.readFileSync(filePath)
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('Not a PNG')

  let offset = 8
  const chunks = []
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset)
    const type = buf.toString('ascii', offset + 4, offset + 8)
    const data = buf.subarray(offset + 8, offset + 8 + length)
    const crc = buf.readUInt32BE(offset + 8 + length)
    chunks.push({ type, data, crc })
    offset += 12 + length
  }
  return chunks
}

function writePng(chunks, filePath) {
  const header = Buffer.alloc(8)
  header.writeUInt32BE(0x89504e47, 0)
  const chunksBuf = Buffer.concat(
    chunks.map((c) => {
      const len = Buffer.alloc(4)
      len.writeUInt32BE(c.data.length)
      const type = Buffer.from(c.type, 'ascii')
      const crc = Buffer.alloc(4)
      crc.writeUInt32BE(c.crc)
      return Buffer.concat([len, type, c.data, crc])
    })
  )
  fs.writeFileSync(filePath, Buffer.concat([header, chunksBuf]))
}

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

for (const logo of logos) {
  const filePath = path.join(publicDir, logo)
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${logo} not found`)
    continue
  }

  const chunks = readPng(filePath)

  // Find IHDR
  const ihdr = chunks.find((c) => c.type === 'IHDR')
  const width = ihdr.data.readUInt32BE(0)
  const height = ihdr.data.readUInt32BE(4)
  const bitDepth = ihdr.data[8]
  const colorType = ihdr.data[9]

  console.log(`${logo}: ${width}x${height}, bitDepth=${bitDepth}, colorType=${colorType}`)

  // Find IDAT
  const idatChunks = chunks.filter((c) => c.type === 'IDAT')
  if (idatChunks.length === 0) {
    console.log(`  SKIP: no IDAT chunks`)
    continue
  }

  const compressed = Buffer.concat(idatChunks.map((c) => c.data))
  const raw = zlib.inflateSync(compressed)

  // bytes per pixel based on color type
  let bpp
  if (colorType === 6) bpp = 4      // RGBA
  else if (colorType === 2) bpp = 3 // RGB
  else if (colorType === 0) bpp = 1 // Grayscale
  else if (colorType === 4) bpp = 2 // Grayscale + Alpha
  else {
    console.log(`  SKIP: unsupported color type ${colorType}`)
    continue
  }

  const stride = width * bpp + 1 // +1 for filter byte per row
  const pixels = Buffer.alloc(width * height * 4, 255)

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride
    const filter = raw[rowStart]
    for (let x = 0; x < width; x++) {
      const srcOff = rowStart + 1 + x * bpp
      const dstOff = (y * width + x) * 4

      let r, g, b, a
      if (colorType === 6) {
        r = raw[srcOff]
        g = raw[srcOff + 1]
        b = raw[srcOff + 2]
        a = raw[srcOff + 3]
      } else if (colorType === 2) {
        r = raw[srcOff]
        g = raw[srcOff + 1]
        b = raw[srcOff + 2]
        a = 255
      } else if (colorType === 0) {
        r = raw[srcOff]
        g = raw[srcOff]
        b = raw[srcOff]
        a = 255
      } else if (colorType === 4) {
        r = raw[srcOff]
        g = raw[srcOff]
        b = raw[srcOff]
        a = raw[srcOff + 1]
      }

      // If pure black, make transparent
      if (r === 0 && g === 0 && b === 0) {
        a = 0
      }

      pixels[dstOff] = r
      pixels[dstOff + 1] = g
      pixels[dstOff + 2] = b
      pixels[dstOff + 3] = a
    }
  }

  // Create new PNG: IHDR (colorType=6 RGBA) + IDAT + IEND
  const newIhdr = Buffer.alloc(13)
  newIhdr.writeUInt32BE(width, 0)
  newIhdr.writeUInt32BE(height, 4)
  newIhdr[8] = 8    // bit depth
  newIhdr[9] = 6    // RGBA
  newIhdr[10] = 0   // compression
  newIhdr[11] = 0   // filter
  newIhdr[12] = 0   // interlace

  // Reconstruct raw data with filter byte per row
  const newStride = width * 4 + 1
  const newRaw = Buffer.alloc(height * newStride)
  for (let y = 0; y < height; y++) {
    newRaw[y * newStride] = 0 // no filter
    for (let x = 0; x < width; x++) {
      const srcOff = (y * width + x) * 4
      const dstOff = y * newStride + 1 + x * 4
      pixels.copy(newRaw, dstOff, srcOff, srcOff + 4)
    }
  }

  const newCompressed = zlib.deflateSync(newRaw)

  const newChunks = [
    { type: 'IHDR', data: newIhdr, crc: 0 },
    { type: 'IDAT', data: newCompressed, crc: 0 },
    { type: 'IEND', data: Buffer.alloc(0), crc: 0 },
  ]

  // Calculate CRCs
  for (const c of newChunks) {
    const typeAndData = Buffer.concat([Buffer.from(c.type, 'ascii'), c.data])
    c.crc = crc32(typeAndData)
  }

  const outPath = path.join(publicDir, logo)
  writePng(newChunks, outPath)

  const stats = fs.statSync(outPath)
  console.log(`  ✓ Transparent background applied — ${(stats.size / 1024).toFixed(0)}KB`)
}

console.log('\nDone!')
