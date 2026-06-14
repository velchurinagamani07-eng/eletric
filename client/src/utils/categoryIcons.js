import {
  BatteryCharging,
  Bell,
  Cable,
  Camera,
  Droplets,
  Fan,
  Home as HomeIcon,
  Lightbulb,
  PlugZap,
  Snowflake,
  ToggleLeft,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react'

export const CATEGORY_ICON_MAP = {
  'fan-services': Fan,
  fans: Fan,
  fan: Fan,
  'wiring-circuits': Cable,
  wiring: Cable,
  sockets: PlugZap,
  socket: PlugZap,
  'ac-services': Snowflake,
  ac: Snowflake,
  'cooler-services': Wind,
  cooler: Wind,
  'lights-switches': Lightbulb,
  lights: Lightbulb,
  'mcb-db-box': ToggleLeft,
  mcb: ToggleLeft,
  'inverter-battery': BatteryCharging,
  inverter: BatteryCharging,
  backup: BatteryCharging,
  'geyser-heater': Droplets,
  geyser: Droplets,
  'home-appliances': HomeIcon,
  appliances: HomeIcon,
  'cctv-security': Camera,
  cctv: Camera,
  security: Camera,
  'motor-pump': Droplets,
  motor: Droplets,
  'doorbell-intercom': Bell,
  doorbell: Bell,
}

export function getCategoryIcon(category = {}) {
  const slug = String(category.slug || category.id || '').toLowerCase()
  const bySlug = CATEGORY_ICON_MAP[slug]
  if (bySlug) return bySlug

  const explicitIcon = String(category.icon || '').toLowerCase()
  const byIcon = CATEGORY_ICON_MAP[explicitIcon]
  if (byIcon) return byIcon

  const name = String(category.name || '').toLowerCase()
  if (name.includes('fan')) return Fan
  if (name.includes('wir') || name.includes('cable')) return Cable
  if (name.includes('socket') || name.includes('plug')) return PlugZap
  if (name.includes('ac') || name.includes('air')) return Snowflake
  if (name.includes('cool')) return Wind
  if (name.includes('light') || name.includes('switch')) return Lightbulb
  if (name.includes('mcb') || name.includes('breaker') || name.includes('db box')) return ToggleLeft
  if (name.includes('inverter') || name.includes('battery') || name.includes('backup')) return BatteryCharging
  if (name.includes('geyser') || name.includes('heater') || name.includes('water')) return Droplets
  if (name.includes('appliance')) return HomeIcon
  if (name.includes('cctv') || name.includes('camera') || name.includes('security')) return Camera
  if (name.includes('motor') || name.includes('pump')) return Droplets
  if (name.includes('bell') || name.includes('intercom') || name.includes('door')) return Bell
  if (name.includes('repair') || name.includes('service')) return Wrench

  return Zap
}
