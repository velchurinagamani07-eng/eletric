function readAsImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load image for compression.'))
    image.src = URL.createObjectURL(file)
  })
}

function canvasToBlob(canvas, quality) {
  if (typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type: 'image/webp', quality })
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Image compression failed.'))
      },
      'image/webp',
      quality,
    )
  })
}

export async function compressToWebP(file, {
  maxWidth = 1200,
  maxSizeKB = 280,
  initialQuality = 0.82,
} = {}) {
  if (!file?.type?.startsWith('image/')) throw new Error('Only image files can be uploaded.')

  const image = await readAsImage(file)
  const scale = Math.min(1, maxWidth / image.width)
  const width = Math.max(1, Math.floor(image.width * scale))
  const height = Math.max(1, Math.floor(image.height * scale))
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(width, height)
    : Object.assign(document.createElement('canvas'), { width, height })
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas compression is not supported.')
  context.drawImage(image, 0, 0, width, height)
  URL.revokeObjectURL(image.src)

  let quality = initialQuality
  let blob = await canvasToBlob(canvas, quality)
  while (blob.size > maxSizeKB * 1024 && quality > 0.25) {
    quality = Math.max(0.25, quality - 0.06)
    blob = await canvasToBlob(canvas, quality)
  }

  const originalName = file.name?.replace(/\.[^.]+$/, '') || `image-${Date.now()}`
  return new File([blob], `${originalName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}
