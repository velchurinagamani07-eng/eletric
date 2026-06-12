const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read image file.'))
    reader.readAsDataURL(file)
  })

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load image for compression.'))
    image.src = src
  })

export async function compressImageWithCanvas(
  file,
  { maxWidth = 800, quality = 0.8, onProgress } = {},
) {
  if (!file) throw new Error('Please choose an image file.')
  if (!file.type?.startsWith('image/')) throw new Error('Only image files can be uploaded.')

  onProgress?.(8)
  const dataUrl = await readAsDataURL(file)
  onProgress?.(32)
  const image = await loadImage(dataUrl)

  const scale = Math.min(1, maxWidth / image.width)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas compression is not supported in this browser.')
  context.drawImage(image, 0, 0, width, height)
  onProgress?.(72)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (nextBlob) resolve(nextBlob)
        else reject(new Error('Image compression failed. Please try another image.'))
      },
      'image/jpeg',
      quality,
    )
  })

  onProgress?.(100)
  const originalName = file.name?.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${originalName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

export async function compressWorkerImage(file, options = {}) {
  return compressImageWithCanvas(file, options)
}

export async function compressAdminImage(file, options = {}) {
  return compressImageWithCanvas(file, options)
}
