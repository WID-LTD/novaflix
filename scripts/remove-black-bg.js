const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const publicDir = path.resolve(__dirname, '..', 'client', 'public')
const files = ['nova-logo.png', 'flix-logo.png', 'leter-mark-logo.png', 'combination-mark-logo.png', 'pictoral-mark-logo.png']

for (const file of files) {
  const filePath = path.join(publicDir, file)
  if (!fs.existsSync(filePath)) { console.log(`SKIP: ${file}`); continue }

  const buf = fs.readFileSync(filePath)
  const png = PNG.sync.read(buf)

  console.log(`${file}: ${png.width}x${png.height} ${png.colorType===2?'RGB':png.colorType===6?'RGBA':'other'}`)

  // Already has alpha? Skip
  if (png.colorType === 6) { console.log(`  already RGBA, checking pixels`); }

  // Ensure RGBA
  const output = new PNG({ width: png.width, height: png.height, colorType: 6 })

  let blackPixels = 0, total = png.width * png.height
  for (let i = 0; i < total; i++) {
    const idx = i * 4
    const r = png.data[idx], g = png.data[idx + 1], b = png.data[idx + 2]
    const a = png.data[idx + 3]
    output.data[idx] = r
    output.data[idx + 1] = g
    output.data[idx + 2] = b
    // If pure black and either no alpha or alpha = 255, make transparent
    if (r === 0 && g === 0 && b === 0) {
      output.data[idx + 3] = 0
      blackPixels++
    } else {
      output.data[idx + 3] = a
    }
  }

  const outBuf = PNG.sync.write(output)
  fs.writeFileSync(filePath, outBuf)
  const size = fs.statSync(filePath).size
  console.log(`  ✓ black pixels: ${blackPixels}/${total} → transparent → ${(size / 1024).toFixed(0)}KB`)
}

console.log('\nDone!')
