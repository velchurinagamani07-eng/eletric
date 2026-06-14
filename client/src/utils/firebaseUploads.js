import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { auth, db, isFirebaseConfigured, storage } from '../firebase/config'
import { apiFetch, getApiBaseUrl, getFirebaseIdToken } from './apiClient'
import { uploadToImgBB } from './uploadToImgBB'

export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function canUseFirestore() {
  return Boolean(isFirebaseConfigured && db && auth?.currentUser)
}

export function canUsePrivateStorage() {
  return Boolean(isFirebaseConfigured && storage && auth?.currentUser)
}

export function safeFileName(fileName = 'image.jpg') {
  return String(fileName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'image.jpg'
}

export function uploadWithProgress(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    if (!storage) {
      reject(new Error('Firebase Storage is not configured.'))
      return
    }

    const task = uploadBytesResumable(ref(storage, path), file, {
      contentType: file.type || 'image/jpeg',
    })
    task.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(progress)
      },
      reject,
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve).catch(reject)
      },
    )
  })
}

async function tryAddNotification(payload) {
  try {
    if (canUseFirestore()) await addDoc(collection(db, 'notifications'), payload)
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Notification write skipped:', error)
  }
}

export async function uploadImageToImgBB({
  file,
  folder = 'uploads',
  onProgress,
  maxWidth = 1200,
  maxSizeKB = 280,
}) {
  const result = await uploadToImgBB(file, {
    name: `${folder}-${Date.now()}-${safeFileName(file.name).replace(/\.[^.]+$/, '')}`,
    onProgress,
    maxWidth,
    maxSizeKB,
  })
  return result.url
}

export async function saveService({
  form,
  imageFile,
  imageFiles = [],
  onProgress,
}) {
  const serviceId = form.id || slugify(form.name) || `service-${Date.now()}`
  const files = imageFiles.length ? imageFiles : imageFile ? [imageFile] : []
  let images = Array.isArray(form.images) ? [...form.images] : form.imageURL ? [form.imageURL] : []

  if (files.length) {
    for (const [index, file] of files.entries()) {
      const url = await uploadImageToImgBB({
        file,
        folder: `services-${serviceId}-${index}`,
        onProgress,
        maxWidth: 1200,
        maxSizeKB: 200,
      })
      images.push(url)
    }
  }

  const imageURL = images[0] || ''

  const payload = {
    name: form.name.trim(),
    category: form.category,
    description: form.description.trim(),
    shortDescription: form.description.trim().slice(0, 120),
    basePrice: Number(form.basePrice),
    duration: form.duration.trim(),
    imageURL,
    images,
    isActive: Boolean(form.isActive),
    slug: serviceId,
    updatedAt: canUseFirestore() ? serverTimestamp() : new Date().toISOString(),
  }

  if (canUseFirestore()) {
    await setDoc(doc(db, 'services', serviceId), {
      ...payload,
      createdAt: serverTimestamp(),
    }, { merge: true })
  }

  return { id: serviceId, ...payload }
}

export async function updateService(serviceId, payload) {
  if (canUseFirestore()) {
    await updateDoc(doc(db, 'services', serviceId), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
  }
  return { id: serviceId, ...payload }
}

export async function deleteService(serviceId) {
  if (canUseFirestore()) await deleteDoc(doc(db, 'services', serviceId))
}

export async function saveCategory({
  form,
  iconFile,
  bannerFile,
  onProgress,
}) {
  const categoryId = form.id || slugify(form.name) || `category-${Date.now()}`
  let iconURL = form.iconURL || ''
  let bannerURL = form.bannerURL || ''

  if (iconFile) {
    iconURL = await uploadImageToImgBB({
      file: iconFile,
      folder: `categories-${categoryId}-icon`,
      onProgress,
      maxWidth: 400,
      maxSizeKB: 80,
    })
  }

  if (bannerFile) {
    bannerURL = await uploadImageToImgBB({
      file: bannerFile,
      folder: `categories-${categoryId}-banner`,
      onProgress,
      maxWidth: 1920,
      maxSizeKB: 280,
    })
  }

  const payload = {
    name: form.name.trim(),
    icon: form.icon || 'Zap',
    iconURL,
    bannerURL,
    slideImage: form.slideImage || '',
    backgroundColor: form.backgroundColor || '#F59E0B',
    description: form.description || '',
    startingPrice: Number(form.startingPrice || 0),
    order: Number(form.order || 1),
    isActive: Boolean(form.isActive),
    slug: categoryId,
    updatedAt: canUseFirestore() ? serverTimestamp() : new Date().toISOString(),
  }

  if (canUseFirestore()) {
    await setDoc(doc(db, 'categories', categoryId), {
      ...payload,
      createdAt: serverTimestamp(),
    }, { merge: true })
  }

  return { id: categoryId, ...payload }
}

export async function updateCategory(categoryId, payload) {
  if (canUseFirestore()) {
    await updateDoc(doc(db, 'categories', categoryId), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
  }
  return { id: categoryId, ...payload }
}

export async function deleteCategory(categoryId) {
  if (canUseFirestore()) await deleteDoc(doc(db, 'categories', categoryId))
}

export async function saveBanner({
  form,
  imageFile,
  onProgress,
}) {
  const bannerId = form.id || slugify(form.title) || `banner-${Date.now()}`
  let imageURL = form.imageURL || ''

  if (imageFile) {
    const folder = form.kind === 'hero' ? 'hero' : 'festival'
    imageURL = await uploadImageToImgBB({
      file: imageFile,
      folder: `banners-${folder}-${bannerId}`,
      onProgress,
      maxWidth: 1920,
      maxSizeKB: 280,
    })
  }

  const payload = {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    ctaText: form.ctaText.trim(),
    ctaLink: form.ctaLink || '/services',
    imageURL,
    kind: form.kind || (form.isFestival ? 'festival' : 'promo'),
    isFestival: Boolean(form.isFestival),
    isActive: Boolean(form.isActive),
    order: Number(form.order || 1),
    updatedAt: canUseFirestore() ? serverTimestamp() : new Date().toISOString(),
  }

  if (canUseFirestore()) {
    await setDoc(doc(db, 'banners', bannerId), {
      ...payload,
      createdAt: serverTimestamp(),
    }, { merge: true })
  }

  return { id: bannerId, ...payload }
}

export async function deleteBanner(bannerId) {
  if (canUseFirestore()) await deleteDoc(doc(db, 'banners', bannerId))
}

export async function uploadProfilePhoto({
  userId,
  file,
  onProgress,
}) {
  const photoURL = await uploadImageToImgBB({
    file,
    folder: `profiles-${userId}`,
    onProgress,
    maxWidth: 400,
    maxSizeKB: 80,
  })
  if (canUseFirestore()) {
    await updateDoc(doc(db, 'users', userId), {
      photoURL,
      updatedAt: serverTimestamp(),
    })
  }
  return photoURL
}

export async function saveProfilePhotoURL({ userId, photoURL }) {
  if (canUseFirestore()) {
    await updateDoc(doc(db, 'users', userId), {
      photoURL,
      updatedAt: serverTimestamp(),
    })
  }
  return photoURL
}

export async function uploadWorkerProfilePhoto({
  workerId,
  file,
  onProgress,
}) {
  let photoURL

  if (getApiBaseUrl()) {
    const result = await uploadWorkerFileViaApi({
      endpoint: `/api/uploads/workers/${workerId}/profile`,
      file,
      onProgress,
    })
    photoURL = result.url
  } else {
    photoURL = await uploadPrivateDocument({
      file,
      path: `workers/${workerId}/profile/profile_${Date.now()}_${safeFileName(file.name)}`,
      onProgress,
    })
  }

  if (canUseFirestore()) {
    await Promise.all([
      setDoc(doc(db, 'workers', workerId), {
        photoURL,
        updatedAt: serverTimestamp(),
      }, { merge: true }),
      setDoc(doc(db, 'users', workerId), {
        photoURL,
        updatedAt: serverTimestamp(),
      }, { merge: true }),
    ])
  }
  return photoURL
}

async function uploadWorkerFileViaApi({ endpoint, file, onProgress }) {
  const formData = new FormData()
  formData.append('file', file)
  onProgress?.(10)
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: formData,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || (!data.url && !data.path)) throw new Error(data.message || 'File upload failed.')
  onProgress?.(100)
  return data
}

export async function uploadPrivateDocument({ path, file, onProgress }) {
  if (!isFirebaseConfigured || !storage) throw new Error('Firebase Storage is not configured.')
  await getFirebaseIdToken()
  return uploadWithProgress(file, path, onProgress)
}

export async function uploadWorkerAadharDocument({ workerId, file, onProgress }) {
  if (getApiBaseUrl()) {
    const result = await uploadWorkerFileViaApi({
      endpoint: `/api/uploads/workers/${workerId}/aadhar`,
      file,
      onProgress,
    })
    return result
  }

  throw new Error('API URL is required for private Aadhaar uploads.')
}

export async function saveWorkerRecord(workerId, payload) {
  if (canUseFirestore()) {
    await setDoc(doc(db, 'workers', workerId), {
      ...payload,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }
  return { uid: workerId, ...payload }
}

export async function updateWorker(workerId, payload) {
  if (canUseFirestore()) {
    await updateDoc(doc(db, 'workers', workerId), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
  }
  return { uid: workerId, ...payload }
}

export async function deleteWorker(workerId) {
  if (canUseFirestore()) await deleteDoc(doc(db, 'workers', workerId))
}

export async function uploadBookingReferencePhoto({
  uid,
  file,
  onProgress,
}) {
  return uploadImageToImgBB({
    file,
    folder: `bookings-temp-${uid}`,
    onProgress,
  })
}

export async function uploadWorkCompletionPhoto({
  file,
  booking,
  workerId,
  workerName,
  onProgress,
}) {
  const bookingId = booking?.bookingId || booking?.id
  const ownerWorkerId = workerId || booking?.workerUID || 'worker-1'
  const photoURL = await uploadImageToImgBB({
    file,
    folder: `workers-${ownerWorkerId}-jobs-${bookingId}`,
    onProgress,
  })

  await recordWorkCompletionPhoto({
    photoURL,
    booking,
    workerId: ownerWorkerId,
    workerName,
  })

  return photoURL
}

export async function recordWorkCompletionPhoto({
  photoURL,
  booking,
  workerId,
  workerName,
}) {
  const bookingId = booking?.bookingId || booking?.id
  const ownerWorkerId = workerId || booking?.workerUID || 'worker-1'

  if (canUseFirestore()) {
    await updateDoc(doc(db, 'bookings', bookingId), {
      completionPhotos: arrayUnion(photoURL),
      workCompletionPhotoURL: photoURL,
      updatedAt: serverTimestamp(),
    })
    await tryAddNotification({
      userId: booking.userId,
      role: 'user',
      title: 'Completion photo uploaded',
      body: 'Your electrician uploaded a job completion photo.',
      bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    })
    await tryAddNotification({
      userId: 'admin',
      role: 'admin',
      title: 'Completion photo uploaded',
      body: `Worker ${workerName || ownerWorkerId || 'assigned worker'} uploaded proof for booking ${bookingId}.`,
      bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    })
  }

  return photoURL
}

export async function updateBookingStatus(bookingId, status, extra = {}) {
  if (canUseFirestore()) {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status,
      ...extra,
      updatedAt: serverTimestamp(),
    })
  }
  return { bookingId, status, ...extra }
}

export async function completeWorkerJob({ booking, workerName, photos = [] }) {
  const bookingId = booking?.bookingId || booking?.id
  if (!bookingId) throw new Error('Booking ID is missing.')

  if (canUseFirestore()) {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status: 'completed',
      completionPhotos: photos,
      workCompletionPhotoURL: photos[0] || booking.workCompletionPhotoURL || '',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await tryAddNotification({
      userId: booking.userId,
      role: 'user',
      title: 'Work Completed!',
      body: 'Your electrician has completed the job. View photos, receipt, and warranty details.',
      bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    })
    await tryAddNotification({
      userId: 'admin',
      role: 'admin',
      title: 'Work Completed',
      body: `Worker ${workerName || 'assigned worker'} completed booking ${bookingId}.`,
      bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    })
  }

  return { ...booking, status: 'completed', completionPhotos: photos }
}
