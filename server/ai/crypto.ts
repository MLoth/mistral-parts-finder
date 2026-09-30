import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { useRuntimeConfig } from '#imports'

function key() {
  const raw = useRuntimeConfig().encryptionKey
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== 32) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_ENCRYPTION_KEY must be 32 bytes, base64 encoded (openssl rand -base64 32)' })
  }
  return buf
}

/** AES-256-GCM. Output: base64(iv | tag | ciphertext) */
export function encrypt(plain: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')
}

export function decrypt(payload: string) {
  const buf = Buffer.from(payload, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12))
  decipher.setAuthTag(buf.subarray(12, 28))
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8')
}
