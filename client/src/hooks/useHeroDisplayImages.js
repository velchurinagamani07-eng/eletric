import { useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, query } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { fallbackHeroDisplayImages } from '../utils/dailyWork'

const imageFromDoc = (item, index) => ({
  id: item.id || `hero-${index + 1}`,
  imageURL: item.imageURL || item.url || item.rightImageURL || '',
  caption: item.caption || item.altText || item.headline || 'Hero image',
  order: Number(item.order || index),
  isActive: item.isActive,
})

export function useHeroDisplayImages() {
  const [homeImages, setHomeImages] = useState([])
  const [settingsImages, setSettingsImages] = useState([])

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined

    const unsubscribe = onSnapshot(
      query(collection(db, 'heroImages_home')),
      (snapshot) => {
        const images = snapshot.docs
          .map((entry, index) => imageFromDoc({ ...entry.data(), id: entry.id }, index))
          .filter((item) => item.imageURL && item.isActive !== false)
          .sort((a, b) => a.order - b.order)
        setHomeImages(images)
      },
      () => setHomeImages([]),
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'hero'),
      (snapshot) => {
        if (!snapshot.exists()) {
          setSettingsImages([])
          return
        }
        const data = snapshot.data()
        const slideImages = Array.isArray(data.slides)
          ? data.slides.map(imageFromDoc)
          : []
        const plainImages = Array.isArray(data.images)
          ? data.images.map((imageURL, index) => imageFromDoc({ imageURL, id: `settings-hero-${index + 1}` }, index))
          : []
        setSettingsImages([...slideImages, ...plainImages].filter((item) => item.imageURL && item.isActive !== false).slice(0, 8))
      },
      () => setSettingsImages([]),
    )

    return unsubscribe
  }, [])

  return useMemo(() => {
    const images = homeImages.length ? homeImages : settingsImages.length ? settingsImages : fallbackHeroDisplayImages
    return { images }
  }, [homeImages, settingsImages])
}
