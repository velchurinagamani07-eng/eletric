export const DEFAULT_SERVICE_IMAGE = '/default-images/services/electric.png'

export const defaultServiceImages = {
  fans: '/default-images/services/fan.png',
  fan: '/default-images/services/fan.png',
  wiring: '/default-images/services/wiring.png',
  sockets: '/default-images/services/socket.png',
  socket: '/default-images/services/socket.png',
  mcb: '/default-images/services/mcb.png',
  lights: '/default-images/services/light.png',
  lighting: '/default-images/services/light.png',
  geyser: '/default-images/services/geyser.png',
  ac: '/default-images/services/ac.png',
  inverter: '/default-images/services/inverter.png',
  backup: '/default-images/services/inverter.png',
  cctv: '/default-images/services/cctv.png',
  security: '/default-images/services/cctv.png',
  earthing: '/default-images/services/earthing.png',
  general: DEFAULT_SERVICE_IMAGE,
}

export function getDefaultImage(category = 'general') {
  return defaultServiceImages[String(category).toLowerCase()] || DEFAULT_SERVICE_IMAGE
}

export function getServiceImage(service) {
  return service?.imageURL || getDefaultImage(service?.category)
}

export function handleImageFallback(event, fallback = DEFAULT_SERVICE_IMAGE) {
  event.currentTarget.onerror = null
  event.currentTarget.src = fallback
}

