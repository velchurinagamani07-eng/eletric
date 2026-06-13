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

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = () => reject(new Error('Unable to read compressed image.'))
    reader.readAsDataURL(file)
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

export async function compressAndUploadToImgBB(
  file,
  { name, onProgress, maxWidth = 1200, maxSizeKB = 280, apiKey = import.meta.env.VITE_IMGBB_API_KEY } = {},
) {
  onProgress?.(5)
  const webpFile = await compressToWebP(file, { maxWidth, maxSizeKB })
  onProgress?.(25)
  return uploadCompressedToImgBB(webpFile, { name, onProgress, apiKey })
}

export async function uploadCompressedToImgBB(
  webpFile,
  { name, onProgress, apiKey = import.meta.env.VITE_IMGBB_API_KEY } = {},
) {
  if (!apiKey) throw new Error('ImgBB API key missing.')
  const base64 = await fileToBase64(webpFile)
  onProgress?.(35)

  const formData = new FormData()
  formData.append('image', base64)
  formData.append('name', name || webpFile.name.replace(/\.[^.]+$/, ''))

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  })
  onProgress?.(90)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload?.data?.url) {
    throw new Error(payload?.error?.message || 'ImgBB upload failed.')
  }
  onProgress?.(100)

  return {
    url: payload.data.display_url || payload.data.url,
    displayUrl: payload.data.display_url || payload.data.url,
    deleteUrl: payload.data.delete_url || '',
    thumbUrl: payload.data.thumb?.url || payload.data.display_url || payload.data.url,
    sizeKB: Math.round(webpFile.size / 1024),
    format: 'webp',
  }
}
