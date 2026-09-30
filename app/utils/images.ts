export type UploadImage = { mediaType: 'image/jpeg', base64: string, preview: string }

/** Shrinks a photo to at most `maxDim` px and re-encodes it as JPEG, so uploads stay small. */
export async function prepareImage(file: File, maxDim = 1568, quality = 0.85): Promise<UploadImage> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const preview = canvas.toDataURL('image/jpeg', quality)
  return { mediaType: 'image/jpeg', base64: preview.split(',')[1]!, preview }
}
