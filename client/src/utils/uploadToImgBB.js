import { compressToWebP } from './compressToWebP'

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

export async function uploadToImgBB(
  file,
  {
    name = '',
    onProgress,
    maxWidth = 1200,
    maxSizeKB = 280,
    apiKey = import.meta.env.VITE_IMGBB_API_KEY,
  } = {},
) {
  if (!apiKey) {
    throw new Error(
      'ImgBB API key is missing (VITE_IMGBB_API_KEY). Set it in the deployment environment and redeploy.',
    )
  }
  if (!(file instanceof File)) throw new Error('Upload input must be an image file.')

  let uploadFile = file
  try {
    uploadFile = await compressToWebP(file, { maxWidth, maxSizeKB })
  } catch (error) {
    console.warn('[ImageUpload] Compression failed; uploading original file:', error)
  }
  onProgress?.(15)

  const base64 = await fileToBase64(uploadFile)
  onProgress?.(30)

  const formData = new FormData()
  formData.append('image', base64)
  formData.append('name', name || uploadFile.name?.replace(/\.[^.]+$/, '') || `image-${Date.now()}`)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.imgbb.com/1/upload?key=${apiKey}`)
    xhr.timeout = 30000

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      onProgress?.(30 + Math.round((event.loaded / event.total) * 65))
    }

    xhr.onerror = () => {
      const error = new Error(
        'Network error while uploading to ImgBB. Check the internet connection or whether an ad-blocker is blocking api.imgbb.com.',
      )
      console.error('[ImageUpload] ImgBB network error:', error)
      reject(error)
    }

    xhr.ontimeout = () => {
      const error = new Error('Upload to ImgBB timed out after 30 seconds. Please try again.')
      console.error('[ImageUpload] ImgBB timeout:', error)
      reject(error)
    }

    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || '{}')
        const url = payload?.data?.display_url || payload?.data?.url
        if (xhr.status < 200 || xhr.status >= 300 || !url) {
          const error = new Error(payload?.error?.message || `ImgBB upload failed (HTTP ${xhr.status}).`)
          console.error('[ImageUpload] ImgBB error response:', payload)
          reject(error)
          return
        }
        onProgress?.(100)
        resolve({
          url,
          displayUrl: url,
          deleteUrl: payload.data.delete_url || '',
          thumbUrl: payload.data.thumb?.url || url,
          sizeKB: Math.round(uploadFile.size / 1024),
          format: uploadFile.type === 'image/webp' ? 'webp' : uploadFile.type || 'image',
        })
      } catch (error) {
        console.error('[ImageUpload] Invalid ImgBB response:', xhr.responseText, error)
        reject(new Error('ImgBB returned an invalid response.', { cause: error }))
      }
    }

    xhr.send(formData)
  })
}
