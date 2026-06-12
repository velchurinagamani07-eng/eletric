const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = () => reject(new Error('Unable to read image file.'))
    reader.readAsDataURL(file)
  })
}

export async function uploadToImgBB(input, { name = '', onProgress, apiKey = IMGBB_KEY } = {}) {
  if (!apiKey) throw new Error('ImgBB API key is missing. Set VITE_IMGBB_API_KEY.')

  let base64
  let uploadName = name

  if (input instanceof File) {
    base64 = await fileToBase64(input)
    uploadName = uploadName || input.name?.replace(/\.[^.]+$/, '') || `image-${Date.now()}`
  } else if (typeof input === 'string') {
    base64 = input.replace(/^data:[^;]+;base64,/, '')
    uploadName = uploadName || `image-${Date.now()}`
  } else {
    throw new Error('Upload input must be a File or base64 image string.')
  }

  const formData = new FormData()
  formData.append('image', base64)
  if (uploadName) formData.append('name', uploadName)

  onProgress?.(10)

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
    url: payload.data.url,
    displayUrl: payload.data.display_url || payload.data.url,
    deleteUrl: payload.data.delete_url || '',
    thumbUrl: payload.data.thumb?.url || payload.data.url,
  }
}

export { uploadWithProgress } from './firebaseUploads'
