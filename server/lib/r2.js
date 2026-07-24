import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET || 'novaflix'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

let _client = null

function getClient() {
  if (_client) return _client
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null
  _client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
  return _client
}

export async function uploadFile({ buffer, key, contentType }) {
  const client = getClient()
  if (!client) {
    return { success: false, error: 'Storage not configured' }
  }
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      })
    )
    const url = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `${R2_ENDPOINT}/${R2_BUCKET}/${key}`
    return { success: true, url }
  } catch (err) {
    console.error('[r2] Upload error:', err.message)
    return { success: false, error: err.message }
  }
}

export async function deleteFile(key) {
  const client = getClient()
  if (!client) return { success: false, error: 'Storage not configured' }
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    )
    return { success: true }
  } catch (err) {
    console.error('[r2] Delete error:', err.message)
    return { success: false, error: err.message }
  }
}

export function isConfigured() {
  return !!getClient()
}
