import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { ArrowDown, ArrowUp, Database, Edit3, Eye, ImageIcon, Save, Trash2, CreditCard, Lock, CheckCircle2, Loader2, X } from 'lucide-react'
import { defaultHero, settings } from '../data/catalog'
import { auth, db, isFirebaseConfigured } from '../firebase/config'
import { useAuthStore } from '../store/authStore'
import ImageUploader from '../components/ImageUploader'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { defaultAnnouncements } from '../data/announcements'
import { uploadToImgBB } from '../utils/uploadToImgBB'

const emptyAnnouncement = { id: '', icon: '', text: '', phone: '', href: '', order: 1, isActive: true }
const emptyPromoSlide = {
  id: '',
  badge: 'Super Saver',
  badgeColor: '#16A34A',
  headline: 'Affordable repairs starting at just Rs. 149',
  bgColor: '#FEF3C7',
  ctaText: 'Book Now',
  ctaLink: '/services',
  rightImageURL: '',
  isActive: true,
  order: 1,
}

const defaultCategories = [
  { id: 'fans', name: 'Fan Services', icon: 'Fan', slug: 'fan-services', startingPrice: 149, isActive: true, order: 1 },
  { id: 'wiring', name: 'Wiring & Circuits', icon: 'Zap', slug: 'wiring-circuits', startingPrice: 299, isActive: true, order: 2 },
  { id: 'ac', name: 'AC Services', icon: 'AC', slug: 'ac-services', startingPrice: 499, isActive: true, order: 3 },
  { id: 'cooler', name: 'Cooler Services', icon: 'Cooler', slug: 'cooler-services', startingPrice: 199, isActive: true, order: 4 },
  { id: 'lights', name: 'Lights', icon: 'Light', slug: 'lights', startingPrice: 149, isActive: true, order: 5 },
  { id: 'switches', name: 'Switches & Sockets', icon: 'Plug', slug: 'switches-sockets', startingPrice: 149, isActive: true, order: 6 },
  { id: 'mcb', name: 'MCB & DB Box', icon: 'MCB', slug: 'mcb-db-box', startingPrice: 199, isActive: true, order: 7 },
  { id: 'inverter', name: 'Inverter & Battery', icon: 'Battery', slug: 'inverter-battery', startingPrice: 299, isActive: true, order: 8 },
  { id: 'geyser', name: 'Geyser & Heater', icon: 'Geyser', slug: 'geyser-heater', startingPrice: 299, isActive: true, order: 9 },
  { id: 'appliances', name: 'Home Appliances', icon: 'Home', slug: 'home-appliances', startingPrice: 349, isActive: true, order: 10 },
  { id: 'cctv', name: 'CCTV & Security', icon: 'CCTV', slug: 'cctv-security', startingPrice: 999, isActive: true, order: 11 },
  { id: 'motor', name: 'Motor & Pump', icon: 'Pump', slug: 'motor-pump', startingPrice: 399, isActive: true, order: 12 },
  { id: 'doorbell', name: 'Doorbell & Intercom', icon: 'Bell', slug: 'doorbell-intercom', startingPrice: 199, isActive: true, order: 13 },
]

const defaultServices = [
  ['Ceiling Fan Installation', 'fans', 'ceiling-fan-installation', 249, 199, '45 mins', ['Fan fitting', 'Wiring connection', 'Speed test']],
  ['Ceiling Fan Repair', 'fans', 'ceiling-fan-repair', 199, 149, '30 mins', ['Fault diagnosis', 'Capacitor check', 'Balancing']],
  ['Exhaust Fan Fitting', 'fans', 'exhaust-fan-fitting', 199, 179, '30 mins', ['Wall/window fitting', 'Wiring', 'Testing']],
  ['House Wiring (1BHK)', 'wiring', 'house-wiring-1bhk', 2999, 2499, '4-6 hrs', ['Full wiring', 'Switch boards', 'Safety check']],
  ['Switch / Socket Repair', 'switches', 'switch-socket-repair', 199, 149, '30 mins', ['Diagnosis', 'Replacement', 'Testing']],
  ['Short Circuit Fix', 'wiring', 'short-circuit-fix', 399, 299, '1-2 hrs', ['Fault location', 'Repair', 'Safety test']],
  ['AC Installation (1.5 Ton)', 'ac', 'ac-installation-1-5-ton', 799, 599, '2-3 hrs', ['Wall mount', 'Copper pipe', 'Remote test']],
  ['AC Service / Deep Clean', 'ac', 'ac-service-deep-clean', 649, 499, '1-2 hrs', ['Filter clean', 'Coil wash', 'Drain check']],
  ['AC Gas Refill (R32)', 'ac', 'ac-gas-refill-r32', 2499, 1999, '1-2 hrs', ['Gas pressure check', 'Leak test', 'Refill']],
  ['Cooler Motor Repair', 'cooler', 'cooler-motor-repair', 299, 249, '1 hr', ['Motor check', 'Repair/replace', 'Pump test']],
  ['Cooler Full Service', 'cooler', 'cooler-full-service', 399, 299, '1-2 hrs', ['Pad replacement', 'Motor service', 'Water pump']],
  ['LED Batten / Light Fitting', 'lights', 'led-batten-fitting', 199, 149, '30 mins', ['Fitting', 'Wiring', 'Testing']],
  ['Fancy Light Installation', 'lights', 'fancy-light-installation', 249, 199, '45 mins', ['Ceiling/wall mount', 'Wiring', 'Dimmer option']],
  ['MCB Replacement', 'mcb', 'mcb-replacement', 249, 199, '30 mins', ['Old MCB removal', 'New MCB fit', 'Load test']],
  ['DB Box Installation', 'mcb', 'db-box-installation', 749, 599, '2-3 hrs', ['DB box fitting', 'MCB wiring', 'Earthing']],
  ['Inverter Installation', 'inverter', 'inverter-installation', 499, 399, '1-2 hrs', ['Mounting', 'Battery connect', 'Load test']],
  ['Inverter Repair', 'inverter', 'inverter-repair', 399, 299, '1 hr', ['Fault diagnosis', 'Board repair', 'Output test']],
  ['Geyser Installation', 'geyser', 'geyser-installation', 499, 399, '1 hr', ['Wall mount', 'Pipe connection', 'Safety valve']],
  ['Geyser Repair', 'geyser', 'geyser-repair', 399, 299, '45 mins', ['Thermostat check', 'Element replace', 'Leak test']],
  ['Washing Machine Repair', 'appliances', 'washing-machine-repair', 499, 399, '1-2 hrs', ['Motor check', 'PCB diagnosis', 'Test wash']],
  ['Refrigerator Repair', 'appliances', 'refrigerator-repair', 649, 499, '1-2 hrs', ['Compressor check', 'Gas test', 'Thermostat']],
  ['TV Repair (LED / LCD)', 'appliances', 'tv-repair-led-lcd', 649, 499, '1-2 hrs', ['Panel diagnosis', 'Power board fix', 'Screen test']],
  ['CCTV Installation (2 Cam)', 'cctv', 'cctv-installation-2-cam', 2499, 1999, '3-4 hrs', ['2 cameras', 'DVR setup', 'Cable routing']],
  ['CCTV Repair / Replacement', 'cctv', 'cctv-repair', 749, 599, '1-2 hrs', ['Camera check', 'Cable test', 'DVR config']],
  ['Motor Pump Installation', 'motor', 'motor-pump-installation', 699, 499, '2-3 hrs', ['Pump mount', 'Starter wiring', 'Test run']],
  ['Motor Pump Repair', 'motor', 'motor-pump-repair', 499, 399, '1-2 hrs', ['Motor rewind', 'Capacitor replace', 'Bearing change']],
  ['Video Doorbell Installation', 'doorbell', 'video-doorbell-installation', 499, 399, '1 hr', ['Wiring', 'App setup', 'Test call']],
].map(([name, category, slug, basePrice, salePrice, duration, inclusions]) => ({
  name,
  category,
  slug,
  basePrice,
  salePrice,
  duration,
  warranty: '1 Month',
  inclusions,
  includes: inclusions,
  isActive: true,
  totalBookings: 0,
  rating: 0,
  totalReviews: 0,
}))

const defaultProducts = [
  ['Copper Electrical Wire (1m)', 'Wire & Cable', 'Havells', 'HV-WIRE-1M', 45, 39, 200, 'meter'],
  ['MCB Switch 32A', 'MCB & DB', 'Legrand', 'LG-MCB-32A', 380, 299, 50, 'piece'],
  ['LED Bulb 9W', 'Bulbs & Lighting', 'Philips', 'PH-LED-9W', 89, 69, 150, 'piece'],
  ['Extension Board 4-Socket', 'Accessories', 'Anchor', 'AN-EXT-4S', 249, 199, 80, 'piece'],
  ['Fan Capacitor 2.5uF', 'Fan Parts', 'Generic', 'FAN-CAP-2-5', 79, 59, 100, 'piece'],
  ['Switch Board 3-Module', 'Switches', 'GM Modular', 'GM-SB-3M', 180, 149, 60, 'piece'],
  ['PVC Conduit Pipe 1m', 'Wire & Cable', 'Precision', 'PC-COND-1M', 35, 29, 300, 'meter'],
  ['Earthing Wire Green 1m', 'Wire & Cable', 'Polycab', 'PC-EARTH-1M', 55, 45, 200, 'meter'],
  ['RCCB 25A / 30mA', 'MCB & DB', 'ABB', 'ABB-RCCB-25A', 850, 699, 30, 'piece'],
  ['LED Tube Light 20W', 'Bulbs & Lighting', 'Wipro', 'WP-LED-20W', 220, 179, 100, 'piece'],
].map(([name, category, brand, sku, price, salePrice, stock, unit]) => ({
  name,
  category,
  categoryId: category,
  brand,
  sku,
  price,
  basePrice: price,
  salePrice,
  stock,
  unit,
  isActive: true,
  totalSold: 0,
  rating: 0,
}))

const themePresets = [
  { name: 'Warm Cream (Light)', values: { 'primary-accent': '#D97706', 'primary-accent-hover': '#B45309', 'page-bg': '#FAF7F2', 'card-bg': '#FFFFFF', 'primary-text': '#1C1917', 'secondary-text': '#78716C', 'heading-text': '#1C1917', 'card-border': '#EBE3D5', 'nav-bg': '#FAF7F2', 'nav-text': '#1C1917', 'announcement-bg': '#F5EBE0', 'announcement-text': '#854D0E' } },
  { name: 'Ocean Breeze (Light)', values: { 'primary-accent': '#0284C7', 'primary-accent-hover': '#0369A1', 'page-bg': '#F0F9FF', 'card-bg': '#FFFFFF', 'primary-text': '#0F172A', 'secondary-text': '#475569', 'heading-text': '#0F172A', 'card-border': '#E0F2FE', 'nav-bg': '#F0F9FF', 'nav-text': '#0F172A', 'announcement-bg': '#BAE6FD', 'announcement-text': '#0369A1' } },
  { name: 'Mint Fresh (Light)', values: { 'primary-accent': '#16A34A', 'primary-accent-hover': '#15803D', 'page-bg': '#F0FDF4', 'card-bg': '#FFFFFF', 'primary-text': '#14532D', 'secondary-text': '#166534', 'heading-text': '#14532D', 'card-border': '#DCFCE7', 'nav-bg': '#F0FDF4', 'nav-text': '#14532D', 'announcement-bg': '#DCFCE7', 'announcement-text': '#15803D' } },
  { name: 'Sleek Slate (Light)', values: { 'primary-accent': '#4F46E5', 'primary-accent-hover': '#4338CA', 'page-bg': '#F8FAFC', 'card-bg': '#FFFFFF', 'primary-text': '#0F172A', 'secondary-text': '#475569', 'heading-text': '#0F172A', 'card-border': '#E2E8F0', 'nav-bg': '#F8FAFC', 'nav-text': '#0F172A', 'announcement-bg': '#E2E8F0', 'announcement-text': '#4338CA' } },
  { name: 'Royal Indigo (Light)', values: { 'primary-accent': '#4F46E5', 'primary-accent-hover': '#4338CA', 'page-bg': '#EEF2FF', 'card-bg': '#FFFFFF', 'primary-text': '#1E1B4B', 'secondary-text': '#4F46E5', 'heading-text': '#1E1B4B', 'card-border': '#C7D2FE', 'nav-bg': '#EEF2FF', 'nav-text': '#1E1B4B', 'announcement-bg': '#C7D2FE', 'announcement-text': '#4338CA' } },
  { name: 'Electric Black', values: { 'primary-accent': '#DC2626', 'primary-accent-hover': '#B91C1C', 'page-bg': '#0A0A0A', 'card-bg': '#161616', 'primary-text': '#FFFFFF', 'secondary-text': '#9CA3AF', 'heading-text': '#FFFFFF', 'card-border': '#27272A', 'nav-bg': '#0A0A0A', 'nav-text': '#FFFFFF', 'announcement-bg': '#0A0A0A', 'announcement-text': '#FFFFFF' } },
  { name: 'Electric Blue', values: { 'primary-accent': '#2563EB', 'primary-accent-hover': '#1D4ED8', 'page-bg': '#0F172A', 'card-bg': '#1E293B', 'primary-text': '#F8FAFC', 'secondary-text': '#94A3B8', 'heading-text': '#F8FAFC', 'card-border': '#334155', 'nav-bg': '#0F172A', 'nav-text': '#F8FAFC', 'announcement-bg': '#1E293B', 'announcement-text': '#F8FAFC' } },
  { name: 'Amber Gold', values: { 'primary-accent': '#F59E0B', 'primary-accent-hover': '#D97706', 'page-bg': '#0F0F0F', 'card-bg': '#1C1C1C', 'primary-text': '#FFFBEB', 'secondary-text': '#D97706', 'heading-text': '#FFFBEB', 'card-border': '#2A2A2A', 'nav-bg': '#0F0F0F', 'nav-text': '#FFFBEB', 'announcement-bg': '#F59E0B', 'announcement-text': '#0F0F0F' } },
  { name: 'Deep Emerald', values: { 'primary-accent': '#10B981', 'primary-accent-hover': '#059669', 'page-bg': '#022C22', 'card-bg': '#064E3B', 'primary-text': '#ECFDF5', 'secondary-text': '#A7F3D0', 'heading-text': '#ECFDF5', 'card-border': '#0F766E', 'nav-bg': '#022C22', 'nav-text': '#ECFDF5', 'announcement-bg': '#064E3B', 'announcement-text': '#ECFDF5' } },
  { name: 'Luxury Gold', values: { 'primary-accent': '#D4AF37', 'primary-accent-hover': '#AA820A', 'page-bg': '#0D0D0D', 'card-bg': '#1A1A1A', 'primary-text': '#FDFDFD', 'secondary-text': '#C5A028', 'heading-text': '#FDFDFD', 'card-border': '#2C2C2C', 'nav-bg': '#0D0D0D', 'nav-text': '#FDFDFD', 'announcement-bg': '#1A1A1A', 'announcement-text': '#D4AF37' } },
  { name: 'Crimson Red', values: { 'primary-accent': '#DC2626', 'primary-accent-hover': '#B91C1C', 'page-bg': '#110000', 'card-bg': '#220000', 'primary-text': '#FFF5F5', 'secondary-text': '#FEB2B2', 'heading-text': '#FFF5F5', 'card-border': '#4A0000', 'nav-bg': '#110000', 'nav-text': '#FFF5F5', 'announcement-bg': '#220000', 'announcement-text': '#FFF5F5' } },
  { name: 'Midnight Violet', values: { 'primary-accent': '#8B5CF6', 'primary-accent-hover': '#7C3AED', 'page-bg': '#090514', 'card-bg': '#120A24', 'primary-text': '#F5F3FF', 'secondary-text': '#DDD6FE', 'heading-text': '#F5F3FF', 'card-border': '#25143E', 'nav-bg': '#090514', 'nav-text': '#F5F3FF', 'announcement-bg': '#120A24', 'announcement-text': '#F5F3FF' } },
  { name: 'Ocean Teal', values: { 'primary-accent': '#14B8A6', 'primary-accent-hover': '#0D9488', 'page-bg': '#041A1E', 'card-bg': '#092D35', 'primary-text': '#F0FDFA', 'secondary-text': '#99F6E4', 'heading-text': '#F0FDFA', 'card-border': '#114B57', 'nav-bg': '#041A1E', 'nav-text': '#F0FDFA', 'announcement-bg': '#092D35', 'announcement-text': '#F0FDFA' } },
  { name: 'Cyberpunk Neon', values: { 'primary-accent': '#F43F5E', 'primary-accent-hover': '#E11D48', 'page-bg': '#030712', 'card-bg': '#0F172A', 'primary-text': '#F8FAFC', 'secondary-text': '#38BDF8', 'heading-text': '#F8FAFC', 'card-border': '#1E293B', 'nav-bg': '#030712', 'nav-text': '#F8FAFC', 'announcement-bg': '#F43F5E', 'announcement-text': '#030712' } },
  { name: 'Slate Silver', values: { 'primary-accent': '#475569', 'primary-accent-hover': '#334155', 'page-bg': '#0F172A', 'card-bg': '#1E293B', 'primary-text': '#F8FAFC', 'secondary-text': '#94A3B8', 'heading-text': '#F8FAFC', 'card-border': '#334155', 'nav-bg': '#0F172A', 'nav-text': '#F8FAFC', 'announcement-bg': '#1E293B', 'announcement-text': '#F8FAFC' } },
  { name: 'Burnt Orange', values: { 'primary-accent': '#EA580C', 'primary-accent-hover': '#C2410C', 'page-bg': '#140A05', 'card-bg': '#26140A', 'primary-text': '#FFF7ED', 'secondary-text': '#FDBA74', 'heading-text': '#FFF7ED', 'card-border': '#4C230C', 'nav-bg': '#140A05', 'nav-text': '#FFF7ED', 'announcement-bg': '#26140A', 'announcement-text': '#FFF7ED' } },
  { name: 'Rose Petal', values: { 'primary-accent': '#F43F5E', 'primary-accent-hover': '#E11D48', 'page-bg': '#1C0A10', 'card-bg': '#30121D', 'primary-text': '#FFF1F2', 'secondary-text': '#FECDD3', 'heading-text': '#FFF1F2', 'card-border': '#5C1D35', 'nav-bg': '#1C0A10', 'nav-text': '#FFF1F2', 'announcement-bg': '#30121D', 'announcement-text': '#FFF1F2' } },
  { name: 'Plum Classic', values: { 'primary-accent': '#86198F', 'primary-accent-hover': '#7C3AED', 'page-bg': '#18041B', 'card-bg': '#2B0C30', 'primary-text': '#FDF4FF', 'secondary-text': '#F5D0FE', 'heading-text': '#FDF4FF', 'card-border': '#4A1553', 'nav-bg': '#18041B', 'nav-text': '#FDF4FF', 'announcement-bg': '#2B0C30', 'announcement-text': '#FDF4FF' } },
  { name: 'Graphite Dark', values: { 'primary-accent': '#27272A', 'primary-accent-hover': '#18181B', 'page-bg': '#09090B', 'card-bg': '#18181B', 'primary-text': '#FAFAFA', 'secondary-text': '#A1A1AA', 'heading-text': '#FAFAFA', 'card-border': '#27272A', 'nav-bg': '#09090B', 'nav-text': '#FAFAFA', 'announcement-bg': '#18181B', 'announcement-text': '#FAFAFA' } },
  { name: 'Forest Moss', values: { 'primary-accent': '#65A30D', 'primary-accent-hover': '#4D7C0F', 'page-bg': '#0B1304', 'card-bg': '#162409', 'primary-text': '#F7FEE7', 'secondary-text': '#D9F99D', 'heading-text': '#F7FEE7', 'card-border': '#283E12', 'nav-bg': '#0B1304', 'nav-text': '#F7FEE7', 'announcement-bg': '#162409', 'announcement-text': '#F7FEE7' } },
  { name: 'Royal Indigo', values: { 'primary-accent': '#4F46E5', 'primary-accent-hover': '#4338CA', 'page-bg': '#060714', 'card-bg': '#0D0E2B', 'primary-text': '#EEF2FF', 'secondary-text': '#C7D2FE', 'heading-text': '#EEF2FF', 'card-border': '#1A1D4E', 'nav-bg': '#060714', 'nav-text': '#EEF2FF', 'announcement-bg': '#0D0E2B', 'announcement-text': '#EEF2FF' } },
  { name: 'Warm Clay', values: { 'primary-accent': '#D97706', 'primary-accent-hover': '#B45309', 'page-bg': '#1C130C', 'card-bg': '#2D1E14', 'primary-text': '#FFFBEB', 'secondary-text': '#FDE68A', 'heading-text': '#FFFBEB', 'card-border': '#4E3523', 'nav-bg': '#1C130C', 'nav-text': '#FFFBEB', 'announcement-bg': '#2D1E14', 'announcement-text': '#FFFBEB' } },
  { name: 'Arctic Breeze', values: { 'primary-accent': '#06B6D4', 'primary-accent-hover': '#0891B2', 'page-bg': '#04151C', 'card-bg': '#092835', 'primary-text': '#ECFEFF', 'secondary-text': '#A5F3FC', 'heading-text': '#ECFEFF', 'card-border': '#113E52', 'nav-bg': '#04151C', 'nav-text': '#ECFEFF', 'announcement-bg': '#092835', 'announcement-text': '#ECFEFF' } },
  { name: 'Berry Red', values: { 'primary-accent': '#BE123C', 'primary-accent-hover': '#9F1239', 'page-bg': '#140409', 'card-bg': '#260813', 'primary-text': '#FFF1F2', 'secondary-text': '#FECDD3', 'heading-text': '#FFF1F2', 'card-border': '#4C1227', 'nav-bg': '#140409', 'nav-text': '#FFF1F2', 'announcement-bg': '#260813', 'announcement-text': '#FFF1F2' } },
  { name: 'Electric Cyan', values: { 'primary-accent': '#06B6D4', 'primary-accent-hover': '#0891B2', 'page-bg': '#080E1A', 'card-bg': '#111A2E', 'primary-text': '#F0FDFA', 'secondary-text': '#99F6E4', 'heading-text': '#F0FDFA', 'card-border': '#1E293B', 'nav-bg': '#080E1A', 'nav-text': '#F0FDFA', 'announcement-bg': '#06B6D4', 'announcement-text': '#080E1A' } },
  { name: 'Vibrant Purple', values: { 'primary-accent': '#A855F7', 'primary-accent-hover': '#9333EA', 'page-bg': '#0F071C', 'card-bg': '#1E0E35', 'primary-text': '#FAF5FF', 'secondary-text': '#E9D5FF', 'heading-text': '#FAF5FF', 'card-border': '#3B1E63', 'nav-bg': '#0F071C', 'nav-text': '#FAF5FF', 'announcement-bg': '#1E0E35', 'announcement-text': '#FAF5FF' } },
  { name: 'Cool Sage', values: { 'primary-accent': '#84CC16', 'primary-accent-hover': '#65A30D', 'page-bg': '#0F171A', 'card-bg': '#1E2C30', 'primary-text': '#F4F8F5', 'secondary-text': '#D2E6D5', 'heading-text': '#F4F8F5', 'card-border': '#2F4349', 'nav-bg': '#0F171A', 'nav-text': '#F4F8F5', 'announcement-bg': '#1E2C30', 'announcement-text': '#F4F8F5' } },
  { name: 'Bronze Rust', values: { 'primary-accent': '#C2410C', 'primary-accent-hover': '#9A3412', 'page-bg': '#1A0F0D', 'card-bg': '#2D1B17', 'primary-text': '#FDF4F2', 'secondary-text': '#F8D3CD', 'heading-text': '#FDF4F2', 'card-border': '#4C2F29', 'nav-bg': '#1A0F0D', 'nav-text': '#FDF4F2', 'announcement-bg': '#2D1B17', 'announcement-text': '#FDF4F2' } },
  { name: 'Electric Mint', values: { 'primary-accent': '#10B981', 'primary-accent-hover': '#059669', 'page-bg': '#061010', 'card-bg': '#0D2020', 'primary-text': '#F0FDF4', 'secondary-text': '#BBF7D0', 'heading-text': '#F0FDF4', 'card-border': '#183E3E', 'nav-bg': '#061010', 'nav-text': '#F0FDF4', 'announcement-bg': '#0D2020', 'announcement-text': '#F0FDF4' } },
  { name: 'Charcoal Wood', values: { 'primary-accent': '#78716C', 'primary-accent-hover': '#57534E', 'page-bg': '#1C1917', 'card-bg': '#292524', 'primary-text': '#FAFAF9', 'secondary-text': '#E7E5E4', 'heading-text': '#FAFAF9', 'card-border': '#44403C', 'nav-bg': '#1C1917', 'nav-text': '#FAFAF9', 'announcement-bg': '#292524', 'announcement-text': '#FAFAF9' } },
  { name: 'Desert Sand', values: { 'primary-accent': '#D97706', 'primary-accent-hover': '#B45309', 'page-bg': '#1A1612', 'card-bg': '#2C251F', 'primary-text': '#FDFBF7', 'secondary-text': '#EFE4D6', 'heading-text': '#FDFBF7', 'card-border': '#4B3F35', 'nav-bg': '#1A1612', 'nav-text': '#FDFBF7', 'announcement-bg': '#2C251F', 'announcement-text': '#FDFBF7' } },
  { name: 'Dark Cherry', values: { 'primary-accent': '#9F1239', 'primary-accent-hover': '#881337', 'page-bg': '#120207', 'card-bg': '#22050E', 'primary-text': '#FFF1F2', 'secondary-text': '#FDA4AF', 'heading-text': '#FFF1F2', 'card-border': '#440B1B', 'nav-bg': '#120207', 'nav-text': '#FFF1F2', 'announcement-bg': '#22050E', 'announcement-text': '#FFF1F2' } },
  { name: 'Twilight Plum', values: { 'primary-accent': '#701A75', 'primary-accent-hover': '#4A044E', 'page-bg': '#100512', 'card-bg': '#1F0B24', 'primary-text': '#FDF4FF', 'secondary-text': '#F3E8FF', 'heading-text': '#FDF4FF', 'card-border': '#3E1847', 'nav-bg': '#100512', 'nav-text': '#FDF4FF', 'announcement-bg': '#1F0B24', 'announcement-text': '#FDF4FF' } },
  { name: 'Cobalt Blue', values: { 'primary-accent': '#1D4ED8', 'primary-accent-hover': '#1E40AF', 'page-bg': '#050B14', 'card-bg': '#0A1629', 'primary-text': '#F0F5FD', 'secondary-text': '#C3D4FA', 'heading-text': '#F0F5FD', 'card-border': '#142C52', 'nav-bg': '#050B14', 'nav-text': '#F0F5FD', 'announcement-bg': '#0A1629', 'announcement-text': '#F0F5FD' } },
  { name: 'Sleek Onyx', values: { 'primary-accent': '#E4E4E7', 'primary-accent-hover': '#D4D4D8', 'page-bg': '#050505', 'card-bg': '#0F0F0F', 'primary-text': '#FFFFFF', 'secondary-text': '#A1A1AA', 'heading-text': '#FFFFFF', 'card-border': '#1C1C1C', 'nav-bg': '#050505', 'nav-text': '#FFFFFF', 'announcement-bg': '#0F0F0F', 'announcement-text': '#FFFFFF' } }
]

export default function AdminSettings({ initialSection = 'company' }) {
  const authReady = useAuthStore((state) => state.authReady)
  const storeUser = useAuthStore((state) => state.user)
  const { items: announcementItems, setItems: setAnnouncementItems } = useFirestoreCollection(
    'announcement_messages',
    defaultAnnouncements,
    'order',
  )
  const [section, setSection] = useState(initialSection)
  const [themeForm, setThemeForm] = useState({
    'primary-accent': '#DC2626',
    'primary-accent-hover': '#B91C1C',
    'page-bg': '#0A0A0A',
    'card-bg': '#161616',
    'primary-text': '#FFFFFF',
    'secondary-text': '#9CA3AF',
    'heading-text': '#FFFFFF',
    'card-border': '#27272A',
    'nav-bg': '#0A0A0A',
    'nav-text': '#FFFFFF',
    'announcement-bg': '#0A0A0A',
    'announcement-text': '#FFFFFF',
  })
  const [showThemePreview, setShowThemePreview] = useState(false)
  const [companyForm, setCompanyForm] = useState({
    companyName: settings.companyName,
    owner: settings.owner,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    homeTitle: 'DP Home Electric Services - Expert Electricians in Tuni',
    homeDescription: 'Book licensed electricians at your doorstep with 1 Month warranty.',
    homeKeywords: 'electrician Tuni, home electrical services, fan installation, wiring repair',
    footerText: settings.footerCredit,
  })
  const [heroForm, setHeroForm] = useState(defaultHero)
  const [promoSlides, setPromoSlides] = useState([])
  const [promoForm, setPromoForm] = useState(emptyPromoSlide)
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncement)
  const [announcementSettings, setAnnouncementSettings] = useState({ rotationSpeedSeconds: 4 })
  const [paymentForm, setPaymentForm] = useState({
    enableCOD: true,
    enableOnline: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    testMode: true,
    gstPercentage: 18,
    gstIncluded: true,
    allowPartial: false,
    advancePercentage: 30,
    geocodingProvider: 'Nominatim',
    geocodingApiKey: '',
  })
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [cleaningCategories, setCleaningCategories] = useState(false)
  const [testStatus, setTestStatus] = useState('idle')
  const [testResult, setTestResult] = useState(null)
  const sortedAnnouncements = [...announcementItems].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
  const sortedPromoSlides = [...promoSlides].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined
    if (!authReady || (storeUser?.uid && !auth?.currentUser?.uid)) return undefined
    let alive = true
    getDoc(doc(db, 'settings', 'hero'))
      .then((snap) => {
        if (alive && snap.exists()) {
          const data = snap.data()
          const slideImages = Array.isArray(data.slides) ? data.slides.map((slide) => slide.imageURL).filter(Boolean) : []
          setHeroForm((current) => ({ ...current, ...data, images: data.images || slideImages || [], slides: data.slides || [] }))
        }
      })
      .catch(() => {})
    getDoc(doc(db, 'settings', 'promoSlides'))
      .then((snap) => {
        if (!alive || !snap.exists()) return
        const data = snap.data()
        const liveSlides = Array.isArray(data.promoSlides) ? data.promoSlides : Array.isArray(data.slides) ? data.slides : []
        setPromoSlides(liveSlides)
      })
      .catch(() => {})
    getDoc(doc(db, 'settings', 'announcementBar'))
      .then((snap) => {
        if (!alive || !snap.exists()) return
        const data = snap.data()
        const speed = Number(data.rotationSpeedSeconds || data.rotationSpeed || 4)
        setAnnouncementSettings({ rotationSpeedSeconds: Number.isFinite(speed) ? speed : 4 })
        if (!announcementItems.length && Array.isArray(data.messages) && data.messages.length) {
          setAnnouncementItems(data.messages.map((message, index) => ({
            ...message,
            id: message.id || `announcement-${index + 1}`,
            order: Number(message.order || index + 1),
          })))
        }
      })
      .catch(() => {})

    getDoc(doc(db, 'settings', 'payment_public'))
      .then((snap) => {
        if (alive && snap.exists()) {
          const data = snap.data()
          setPaymentForm((current) => ({ ...current, ...data }))
        }
      })
      .catch(() => {})

    getDoc(doc(db, 'settings', 'payment_secret'))
      .then((snap) => {
        if (alive && snap.exists()) {
          const data = snap.data()
          setPaymentForm((current) => ({ ...current, ...data }))
        }
      })
      .catch(() => {})

    getDoc(doc(db, 'settings', 'theme'))
      .then((snap) => {
        if (alive && snap.exists()) {
          const data = snap.data()
          setThemeForm((current) => ({ ...current, ...data }))
        }
      })
      .catch(() => {})

    return () => {
      alive = false
    }
  }, [announcementItems.length, setAnnouncementItems, authReady, storeUser?.uid, auth?.currentUser?.uid])

  const updateCompany = (field, value) => setCompanyForm((current) => ({ ...current, [field]: value }))
  const updateHero = (field, value) => setHeroForm((current) => ({ ...current, [field]: value }))
  const updatePromo = (field, value) => setPromoForm((current) => ({ ...current, [field]: value }))
  const updateAnnouncement = (field, value) => setAnnouncementForm((current) => ({ ...current, [field]: value }))
  const updateAnnouncementSettings = (field, value) => setAnnouncementSettings((current) => ({ ...current, [field]: value }))
  const updatePayment = (field, value) => setPaymentForm((current) => ({ ...current, [field]: value }))
  const updateTheme = (field, value) => setThemeForm((current) => ({ ...current, [field]: value }))

  const saveTheme = async (event) => {
    event?.preventDefault?.()
    setSaving(true)
    try {
      if (db && isFirebaseConfigured) {
        await setDoc(doc(db, 'settings', 'theme'), {
          ...themeForm,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
      toast.success('Theme settings updated successfully.')
    } catch (error) {
      toast.error(error.message || 'Unable to save theme settings.')
    } finally {
      setSaving(false)
    }
  }

  const resetTheme = () => {
    if (!window.confirm('Reset theme to Electric Black defaults?')) return
    const defaults = {
      'primary-accent': '#DC2626',
      'primary-accent-hover': '#B91C1C',
      'page-bg': '#0A0A0A',
      'card-bg': '#161616',
      'primary-text': '#FFFFFF',
      'secondary-text': '#9CA3AF',
      'card-border': '#27272A',
      'nav-bg': '#0A0A0A',
      'nav-text': '#FFFFFF',
      'announcement-bg': '#0A0A0A',
      'announcement-text': '#FFFFFF',
    }
    setThemeForm(defaults)
  }

  const testImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setTestStatus('uploading')
    setTestResult(null)
    try {
      console.log('[TestUpload] Starting upload:', file.name, file.size, 'bytes')
      console.log('[TestUpload] VITE_IMGBB_API_KEY present?', Boolean(import.meta.env.VITE_IMGBB_API_KEY))
      const result = await uploadToImgBB(file, {
        name: 'diagnostic-test',
        onProgress: (progress) => console.log('[TestUpload] Progress:', progress),
      })
      console.log('[TestUpload] Success:', result.url)
      setTestResult(result.url)
      setTestStatus('success')
      toast.success('Test upload succeeded.')
    } catch (error) {
      console.error('[TestUpload] Failed:', error)
      const message = error?.message || 'Unknown image upload error.'
      setTestResult(message)
      setTestStatus('error')
      toast.error(`Test upload failed: ${message}`, { duration: 10000 })
    }
  }

  const saveCompany = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (db && isFirebaseConfigured) {
        await setDoc(doc(db, 'settings', 'contact'), {
          phone: companyForm.phone,
          whatsapp: companyForm.whatsapp,
          email: companyForm.email,
          address: companyForm.address,
          owner: companyForm.owner,
          updatedAt: serverTimestamp(),
        })
        await setDoc(doc(db, 'settings', 'seo'), {
          homeTitle: companyForm.homeTitle,
          homeDescription: companyForm.homeDescription,
          homeKeywords: companyForm.homeKeywords,
          updatedAt: serverTimestamp(),
        })
      }
      toast.success('Settings saved.')
    } catch (error) {
      toast.error(error.message || 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const savePromoSlide = async (event) => {
    event.preventDefault()
    if (!promoForm.headline.trim()) {
      toast.error('Promo headline is required.')
      return
    }

    setSaving(true)
    try {
      const id = promoForm.id || `promo-${Date.now()}`
      const payload = {
        ...promoForm,
        id,
        badge: promoForm.badge.trim(),
        headline: promoForm.headline.trim(),
        ctaText: promoForm.ctaText.trim(),
        ctaLink: promoForm.ctaLink.trim() || '/services',
        rightImageURL: promoForm.rightImageURL || '',
        order: Number(promoForm.order || sortedPromoSlides.length + 1),
        isActive: Boolean(promoForm.isActive),
      }
      const nextSlides = sortedPromoSlides.some((slide) => slide.id === id)
        ? sortedPromoSlides.map((slide) => (slide.id === id ? payload : slide))
        : [...sortedPromoSlides, payload]

      if (db && isFirebaseConfigured) {
        await setDoc(doc(db, 'settings', 'promoSlides'), {
          promoSlides: nextSlides,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }

      setPromoSlides(nextSlides)
      setPromoForm({ ...emptyPromoSlide, order: nextSlides.length + 1 })
      toast.success('Promo slide saved.')
    } catch (error) {
      toast.error(error.message || 'Unable to save promo slide.')
    } finally {
      setSaving(false)
    }
  }

  const editPromoSlide = (slide) => {
    setPromoForm({ ...emptyPromoSlide, ...slide, isActive: slide.isActive !== false })
  }

  const removePromoSlide = async (slide) => {
    if (!window.confirm(`Delete promo '${slide.headline}'?`)) return
    setSaving(true)
    try {
      const nextSlides = sortedPromoSlides.filter((item) => item.id !== slide.id)
      if (db && isFirebaseConfigured) {
        await setDoc(doc(db, 'settings', 'promoSlides'), {
          promoSlides: nextSlides,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
      setPromoSlides(nextSlides)
      if (promoForm.id === slide.id) setPromoForm({ ...emptyPromoSlide, order: nextSlides.length + 1 })
      toast.success('Promo slide deleted.')
    } catch (error) {
      toast.error(error.message || 'Unable to delete promo slide.')
    } finally {
      setSaving(false)
    }
  }

  const seedDefaultData = async () => {
    if (!db || !isFirebaseConfigured) {
      toast.error('Firestore is not configured.')
      return
    }
    if (!window.confirm('Seed default categories, services, product categories, and products? Existing matching IDs will be updated.')) return

    setSeeding(true)
    try {
      const batch = writeBatch(db)
      defaultCategories.forEach((category) => {
        batch.set(doc(db, 'categories', category.id), {
          ...category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
      })
      defaultServices.forEach((service, index) => {
        batch.set(doc(db, 'services', service.slug), {
          ...service,
          order: index + 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
      })
      const productCategories = [...new Set(defaultProducts.map((product) => product.categoryId || product.category).filter(Boolean))]
      productCategories.forEach((category, index) => {
        batch.set(doc(db, 'product_categories', category), {
          name: category,
          slug: String(category).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          order: index + 1,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
      })
      defaultProducts.forEach((product, index) => {
        const id = String(product.sku || product.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        batch.set(doc(db, 'products', id), {
          ...product,
          slug: id,
          order: index + 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
      })
      await batch.commit()
      toast.success('Default catalog seeded.')
    } catch (error) {
      toast.error(error.message || 'Unable to seed default data.')
    } finally {
      setSeeding(false)
    }
  }

  const cleanupInvalidCategories = async () => {
    if (!db || !isFirebaseConfigured) {
      toast.error('Firestore is not configured.')
      return
    }
    if (!window.confirm('Remove invalid category records that look like worker profiles?')) return

    setCleaningCategories(true)
    try {
      const snap = await getDocs(collection(db, 'categories'))
      const batch = writeBatch(db)
      let removed = 0
      snap.forEach((docSnap) => {
        const data = docSnap.data()
        const name = String(data.name || '').trim().toLowerCase()
        const looksLikeWorker =
          name === 'mahi' ||
          'specialization' in data ||
          'phone' in data ||
          'mobile' in data ||
          'photoURL' in data ||
          ('rating' in data && 'totalJobsCompleted' in data)
        const missingCategoryFields = !data.slug
        if (looksLikeWorker || missingCategoryFields) {
          batch.delete(docSnap.ref)
          removed += 1
        }
      })
      if (removed > 0) await batch.commit()
      toast.success(`Removed ${removed} invalid category record(s).`)
    } catch (error) {
      toast.error(error.message || 'Unable to clean categories.')
    } finally {
      setCleaningCategories(false)
    }
  }

  const saveHero = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (db && isFirebaseConfigured) {
        await setDoc(
          doc(db, 'settings', 'hero'),
          {
            ...heroForm,
            slides: (heroForm.images || []).slice(0, 8).map((imageURL, index) => ({
              id: `hero-slide-${index + 1}`,
              imageURL,
              altText: `${settings.companyName} hero slide ${index + 1}`,
            })),
            customers: Number(heroForm.customers || 500),
            workers: Number(heroForm.workers || 50),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      }
      toast.success('Hero section saved.')
    } catch (error) {
      toast.error(error.message || 'Unable to save hero settings.')
    } finally {
      setSaving(false)
    }
  }

  const saveAnnouncement = async (event) => {
    event.preventDefault()
    if (!announcementForm.text.trim()) {
      toast.error('Announcement text is required.')
      return
    }

    setSaving(true)
    try {
      const id = announcementForm.id || `announcement-${Date.now()}`
      const payload = {
        icon: announcementForm.icon.trim(),
        text: announcementForm.text.trim(),
        phone: announcementForm.phone.trim(),
        href: announcementForm.href.trim(),
        order: Number(announcementForm.order || sortedAnnouncements.length + 1),
        isActive: Boolean(announcementForm.isActive),
        updatedAt: db && isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
      }

      const nextItems = sortedAnnouncements.some((item) => item.id === id)
        ? sortedAnnouncements.map((item) => (item.id === id ? { ...item, ...payload, id } : item))
        : [{ id, ...payload }, ...sortedAnnouncements]

      if (db && isFirebaseConfigured) {
        await Promise.all([
          setDoc(doc(db, 'announcement_messages', id), payload, { merge: true }),
          saveAnnouncementBarSettings(nextItems),
        ])
      }

      setAnnouncementItems(nextItems)
      setAnnouncementForm(emptyAnnouncement)
      toast.success('Announcement saved.')
    } catch (error) {
      toast.error(error.message || 'Unable to save announcement.')
    } finally {
      setSaving(false)
    }
  }

  const removeAnnouncement = async (item) => {
    if (!window.confirm(`Delete '${item.text}'?`)) return
    try {
      const nextItems = sortedAnnouncements.filter((entry) => entry.id !== item.id)
      if (db && isFirebaseConfigured) {
        await Promise.all([
          deleteDoc(doc(db, 'announcement_messages', item.id)),
          saveAnnouncementBarSettings(nextItems),
        ])
      }
      setAnnouncementItems(nextItems)
      toast.success('Announcement deleted.')
    } catch (error) {
      toast.error(error.message || 'Unable to delete announcement.')
    }
  }

  const moveAnnouncement = async (item, direction) => {
    const index = sortedAnnouncements.findIndex((entry) => entry.id === item.id)
    const next = sortedAnnouncements[index + direction]
    if (!next) return

    const first = { ...item, order: Number(next.order || index + 1) }
    const second = { ...next, order: Number(item.order || index + 1) }
    try {
      if (db && isFirebaseConfigured) {
        const nextItems = sortedAnnouncements.map((entry) => (entry.id === first.id ? first : entry.id === second.id ? second : entry))
        await Promise.all([
          setDoc(doc(db, 'announcement_messages', first.id), { order: first.order, updatedAt: serverTimestamp() }, { merge: true }),
          setDoc(doc(db, 'announcement_messages', second.id), { order: second.order, updatedAt: serverTimestamp() }, { merge: true }),
          saveAnnouncementBarSettings(nextItems),
        ])
      }
      setAnnouncementItems((items) =>
        items.map((entry) => (entry.id === first.id ? { ...entry, order: first.order } : entry.id === second.id ? { ...entry, order: second.order } : entry)),
      )
    } catch (error) {
      toast.error(error.message || 'Unable to reorder announcements.')
    }
  }

  const saveAnnouncementBarSettings = async (items = sortedAnnouncements) => {
    if (!db || !isFirebaseConfigured) return
    const messages = [...items]
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
      .map(({ id, icon = '', text = '', phone = '', href = '', order = 1, isActive = true }) => ({
        id,
        icon,
        text,
        phone,
        href,
        order: Number(order || 1),
        isActive: isActive !== false,
      }))
    await setDoc(doc(db, 'settings', 'announcementBar'), {
      rotationSpeedSeconds: Number(announcementSettings.rotationSpeedSeconds || 4),
      messages,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  const saveAnnouncementSettings = async () => {
    try {
      await saveAnnouncementBarSettings()
      toast.success('Announcement rotation settings saved.')
    } catch (error) {
      toast.error(error.message || 'Unable to save announcement settings.')
    }
  }

  const savePaymentSettings = async (event) => {
    event.preventDefault()
    
    if (paymentForm.enableOnline) {
      if (!paymentForm.razorpayKeyId || !paymentForm.razorpayKeySecret) {
        toast.error('Razorpay Key ID and Key Secret are required when online payments are enabled.')
        return
      }
    }

    setSaving(true)
    try {
      if (db && isFirebaseConfigured) {
        // Write public settings
        await setDoc(doc(db, 'settings', 'payment_public'), {
          enableCOD: paymentForm.enableCOD !== false,
          enableOnline: paymentForm.enableOnline === true && paymentForm.razorpayKeyId !== '' && paymentForm.razorpayKeySecret !== '',
          razorpayKeyId: paymentForm.razorpayKeyId,
          testMode: paymentForm.testMode !== false,
          gstPercentage: Number(paymentForm.gstPercentage ?? 18),
          gstIncluded: paymentForm.gstIncluded !== false,
          allowPartial: paymentForm.allowPartial === true,
          advancePercentage: Number(paymentForm.advancePercentage ?? 30),
          geocodingProvider: paymentForm.geocodingProvider || 'Nominatim',
          geocodingApiKey: paymentForm.geocodingApiKey || '',
          updatedAt: serverTimestamp(),
        }, { merge: true })

        // Write secret settings (only accessible by Admin/Backend)
        await setDoc(doc(db, 'settings', 'payment_secret'), {
          razorpayKeySecret: paymentForm.razorpayKeySecret,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
      toast.success('Payment settings updated successfully.')
    } catch (error) {
      toast.error(error.message || 'Unable to save payment settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-sm">
        {[
          ['company', 'Company'],
          ['hero', 'Hero Section'],
          ['promo', 'Home Promo Slides'],
          ['announcements', 'Announcement Bar'],
          ['payment', 'Payment Gateway'],
          ['theme', 'Website Colors & Theme'],
          ['tools', 'Developer Tools'],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            onClick={() => setSection(id)}
            className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${
              section === id ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'company' && (
        <form onSubmit={saveCompany} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-navy-900 dark:text-white">Company & SEO Settings</h2>
              <p className="mt-1 text-sm text-gray-500">Contact info, SEO, and footer text.</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white shadow-sm">
                <img src="/logo.webp" alt="" className="h-full w-full object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} />
              </span>
              <div>
                <p className="text-sm font-black text-amber-900 dark:text-amber-100">Logo is fixed for production</p>
                <p className="mt-1 text-xs font-semibold text-amber-800/75 dark:text-amber-100/70">
                  Replace <code className="rounded bg-white/70 px-1 py-0.5">client/public/logo.webp</code> during deployment to update every public logo and receipt fallback.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ['companyName', 'Company name'],
              ['owner', 'Owner'],
              ['phone', 'Phone'],
              ['whatsapp', 'WhatsApp number'],
              ['email', 'Email'],
              ['address', 'Address'],
              ['homeTitle', 'Home meta title'],
              ['homeDescription', 'Home meta description'],
              ['homeKeywords', 'Home meta keywords'],
              ['footerText', 'Footer text'],
            ].map(([field, label]) => (
              <label key={field} className={['address', 'homeDescription', 'homeKeywords', 'footerText'].includes(field) ? 'md:col-span-2' : ''}>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                <input className="field" value={companyForm[field]} onChange={(event) => updateCompany(field, event.target.value)} />
              </label>
            ))}
          </div>

          <button type="submit" className="btn-primary mt-5" disabled={saving}><Save size={17} /> Save Settings</button>
        </form>
      )}

      {section === 'hero' && (
        <form onSubmit={saveHero} className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <h2 className="font-bold text-navy-900 dark:text-white">Hero Section</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ['headline', 'Headline'],
                ['subheadline', 'Subheadline'],
                ['ctaText', 'CTA text'],
                ['ctaLink', 'CTA link'],
                ['secondaryCtaText', 'Secondary CTA'],
                ['secondaryCtaLink', 'Secondary CTA link'],
                ['badgeText', 'Badge text'],
                ['badgeText1', 'Trust badge 1'],
                ['badgeText2', 'Trust badge 2'],
                ['badgeText3', 'Trust badge 3'],
                ['badgeText4', 'Trust badge 4'],
                ['customers', 'Customers stat'],
                ['workers', 'Workers stat'],
                ['warranty', 'Warranty stat'],
                ['rating', 'Rating stat'],
              ].map(([field, label]) => (
                <label key={field} className={['headline', 'subheadline'].includes(field) ? 'md:col-span-2' : ''}>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                  <input className="field" value={heroForm[field]} onChange={(event) => updateHero(field, event.target.value)} />
                </label>
              ))}
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={heroForm.isActive} onChange={(event) => updateHero('isActive', event.target.checked)} />
                Hero active
              </label>
            </div>
            <div className="mt-5">
              <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Hero images</span>
              <ImageUploader
                label="Upload up to 8 hero images"
                multiple
                maxFiles={8}
                currentImageUrl={heroForm.images || []}
                folder="settings-hero"
                onUploadComplete={(urls) => updateHero('images', urls.slice(0, 8))}
              />
            </div>
            <button type="submit" className="btn-primary mt-5" disabled={saving}><Save size={17} /> Save Hero</button>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-navy-900 p-5 text-white shadow-sm">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-400"><Eye size={17} /> Live Preview</p>
            <p className="mt-5 inline-flex rounded-full border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-400">{heroForm.badgeText}</p>
            <h3 className="mt-5 text-3xl font-extrabold">{heroForm.headline}</h3>
            <p className="mt-3 text-sm leading-7 text-white/75">{heroForm.subheadline}</p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-navy-900">{heroForm.ctaText}</span>
              <span className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold">{heroForm.secondaryCtaText}</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {(heroForm.images || []).slice(0, 4).map((image, index) => (
                <img key={`${image}-${index}`} src={image} alt="" className={`h-28 rounded-xl object-cover ${index === 0 ? 'col-span-2' : ''}`} />
              ))}
            </div>
          </aside>
        </form>
      )}

      {section === 'promo' && (
        <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <form onSubmit={savePromoSlide} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <h2 className="font-bold text-navy-900 dark:text-white">Home Promo Slides</h2>
            <p className="mt-1 text-sm text-gray-500">Slides appear in the home page promo banner. The right-side image is required for a polished split banner.</p>
            <div className="mt-5 grid gap-4">
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Badge</span>
                <input className="field" value={promoForm.badge} onChange={(event) => updatePromo('badge', event.target.value)} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Headline</span>
                <input className="field" value={promoForm.headline} onChange={(event) => updatePromo('headline', event.target.value)} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Badge / CTA color</span>
                  <input className="field h-11" type="color" value={promoForm.badgeColor} onChange={(event) => updatePromo('badgeColor', event.target.value)} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Background color</span>
                  <input className="field h-11" type="color" value={promoForm.bgColor} onChange={(event) => updatePromo('bgColor', event.target.value)} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">CTA text</span>
                  <input className="field" value={promoForm.ctaText} onChange={(event) => updatePromo('ctaText', event.target.value)} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">CTA link</span>
                  <input className="field" value={promoForm.ctaLink} onChange={(event) => updatePromo('ctaLink', event.target.value)} />
                </label>
              </div>
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Sort order</span>
                <input className="field" type="number" min="1" value={promoForm.order} onChange={(event) => updatePromo('order', event.target.value)} />
              </label>
              <ImageUploader
                label="Upload right-side banner image"
                currentImageUrl={promoForm.rightImageURL}
                folder="settings-promo"
                onUploadComplete={(url) => updatePromo('rightImageURL', url)}
              />
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={promoForm.isActive} onChange={(event) => updatePromo('isActive', event.target.checked)} />
                Slide active
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save size={17} /> {promoForm.id ? 'Update Slide' : 'Add Slide'}
              </button>
              {promoForm.id && (
                <button type="button" className="btn-secondary" onClick={() => setPromoForm({ ...emptyPromoSlide, order: sortedPromoSlides.length + 1 })}>
                  Clear
                </button>
              )}
            </div>
          </form>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <h3 className="font-bold text-navy-900 dark:text-white">Slides</h3>
            <div className="mt-4 grid gap-3">
              {sortedPromoSlides.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm font-semibold text-gray-500 dark:border-white/10">
                  No promo slides yet. Add one to replace the home banner fallback.
                </div>
              ) : sortedPromoSlides.map((slide) => (
                <article key={slide.id} className="grid gap-3 rounded-xl border border-gray-100 p-4 dark:border-white/10 sm:grid-cols-[140px_1fr_auto]">
                  {slide.rightImageURL ? (
                    <img src={slide.rightImageURL} alt="" className="h-24 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-24 place-items-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/10">
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-amber-600">{slide.badge || 'Promo'} | Order {slide.order || 1}</p>
                    <h4 className="mt-1 font-bold text-gray-950 dark:text-white">{slide.headline}</h4>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      {slide.ctaText || 'Book Now'} {'->'} {slide.ctaLink || '/services'} | {slide.isActive === false ? 'Hidden' : 'Active'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Edit promo slide" onClick={() => editPromoSlide(slide)}>
                      <Edit3 size={16} />
                    </button>
                    <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50" aria-label="Delete promo slide" onClick={() => removePromoSlide(slide)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {section === 'announcements' && (
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={saveAnnouncement} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
            <h2 className="font-bold text-white">Announcement Bar</h2>
            <p className="mt-1 text-sm text-gray-400">Rotating public messages above the navbar.</p>
            <div className="mt-5 grid gap-4">
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-300">Rotation speed (seconds)</span>
                <div className="flex gap-2">
                  <input
                    className="field"
                    type="number"
                    min="2"
                    max="12"
                    value={announcementSettings.rotationSpeedSeconds}
                    onChange={(event) => updateAnnouncementSettings('rotationSpeedSeconds', event.target.value)}
                  />
                  <button type="button" className="btn-secondary shrink-0" onClick={saveAnnouncementSettings}>
                    Save Speed
                  </button>
                </div>
              </label>
              <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-300">Icon</span>
                  <input className="field" placeholder="⚡" value={announcementForm.icon} onChange={(event) => updateAnnouncement('icon', event.target.value)} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-300">Message text</span>
                  <input className="field" value={announcementForm.text} onChange={(event) => updateAnnouncement('text', event.target.value)} />
                </label>
              </div>
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-300">Tap-to-call phone</span>
                <input className="field" placeholder="9398724704" value={announcementForm.phone} onChange={(event) => updateAnnouncement('phone', event.target.value)} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-300">Optional link</span>
                <input className="field" placeholder="tel:9398724704 or /services" value={announcementForm.href} onChange={(event) => updateAnnouncement('href', event.target.value)} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-300">Sort order</span>
                <input className="field" type="number" min="1" value={announcementForm.order} onChange={(event) => updateAnnouncement('order', event.target.value)} />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-300">
                <input type="checkbox" className="h-4 w-4 accent-red-600" checked={announcementForm.isActive} onChange={(event) => updateAnnouncement('isActive', event.target.checked)} />
                Active
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="submit" className="btn-primary" disabled={saving}><Save size={17} /> {announcementForm.id ? 'Update' : 'Add'} Message</button>
              {announcementForm.id && (
                <button type="button" className="btn-secondary" onClick={() => setAnnouncementForm(emptyAnnouncement)}>
                  Clear
                </button>
              )}
            </div>
          </form>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
            <h3 className="font-bold text-white">Messages</h3>
            <div className="mt-4 grid gap-3">
              {sortedAnnouncements.map((item) => (
                <article key={item.id} className="rounded-lg border border-zinc-800 bg-black/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{item.icon ? `${item.icon} ` : ''}{item.text}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-400">
                        {item.phone ? `Call ${item.phone}` : item.href || 'No link'} | Order {item.order} | {item.isActive === false ? 'Hidden' : 'Active'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-300 hover:bg-zinc-800" aria-label="Move up" onClick={() => moveAnnouncement(item, -1)}><ArrowUp size={16} /></button>
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-300 hover:bg-zinc-800" aria-label="Move down" onClick={() => moveAnnouncement(item, 1)}><ArrowDown size={16} /></button>
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-300 hover:bg-zinc-800" aria-label="Edit" onClick={() => setAnnouncementForm({ ...emptyAnnouncement, ...item, href: item.href || '', phone: item.phone || '', icon: item.icon || '', order: item.order || 1, isActive: item.isActive !== false })}><Edit3 size={16} /></button>
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-500 hover:bg-red-600/10" aria-label="Delete" onClick={() => removeAnnouncement(item)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {section === 'payment' && (
        <form onSubmit={savePaymentSettings} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div>
            <h2 className="font-bold text-navy-900 dark:text-white">Payment & Gateway Settings</h2>
            <p className="mt-1 text-sm text-gray-500">Configure checkout payment methods, Razorpay credentials, and taxes.</p>
          </div>

          <div className="mt-5 space-y-6">
            {/* Payment Toggles */}
            <div className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-amber-500"
                  checked={paymentForm.enableCOD}
                  onChange={(event) => updatePayment('enableCOD', event.target.checked)}
                />
                <div>
                  <span className="block text-sm font-bold text-white">Enable Cash on Delivery (COD)</span>
                  <span className="block text-xs text-gray-400">Allow customers to book now and pay cash to worker.</span>
                </div>
              </label>

              <label className={`flex items-center gap-3 cursor-pointer ${(!paymentForm.razorpayKeyId || !paymentForm.razorpayKeySecret) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-amber-500"
                  disabled={!paymentForm.razorpayKeyId || !paymentForm.razorpayKeySecret}
                  checked={paymentForm.enableOnline}
                  onChange={(event) => {
                    if (!paymentForm.razorpayKeyId || !paymentForm.razorpayKeySecret) {
                      toast.error('Please configure and save Razorpay Key ID and Secret first.')
                      return
                    }
                    updatePayment('enableOnline', event.target.checked)
                  }}
                />
                <div>
                  <span className="block text-sm font-bold text-white">Enable Online Payment (Razorpay)</span>
                  <span className="block text-xs text-gray-400">Accept credit/debit cards, UPI, and wallets.</span>
                </div>
              </label>
            </div>

            {/* Razorpay Credentials */}
            <div className="space-y-4 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Lock size={15} /> Razorpay API Credentials</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-300">Razorpay Key ID</span>
                  <input
                    className="field"
                    placeholder="rzp_test_..."
                    value={paymentForm.razorpayKeyId || ''}
                    onChange={(event) => updatePayment('razorpayKeyId', event.target.value)}
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-300">Razorpay Key Secret</span>
                  <input
                    type="password"
                    className="field"
                    placeholder="••••••••••••••••••••••••"
                    value={paymentForm.razorpayKeySecret || ''}
                    onChange={(event) => updatePayment('razorpayKeySecret', event.target.value)}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-amber-500"
                    checked={paymentForm.testMode}
                    onChange={(event) => {
                      const modeVal = event.target.checked
                      if (!modeVal) {
                        const confirmLive = window.confirm(
                          '⚠️ WARNING: You are switching to LIVE MODE. Real financial transactions will be processed. Are you sure you want to proceed?'
                        )
                        if (!confirmLive) return
                      }
                      updatePayment('testMode', modeVal)
                    }}
                  />
                  <div>
                    <span className="block text-sm font-bold text-white">Sandbox / Test Mode</span>
                    <span className="block text-xs text-gray-400">Use test API keys instead of production.</span>
                  </div>
                </label>

                {!paymentForm.testMode && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
                    ⚠️ LIVE TRANSACTION MODE ACTIVE
                  </div>
                )}
              </div>
            </div>

            {/* GST & Taxes */}
            <div className="space-y-4 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><CreditCard size={15} /> GST / Tax Settings</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-300">GST Percentage (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="field"
                    value={paymentForm.gstPercentage ?? 18}
                    onChange={(event) => updatePayment('gstPercentage', Number(event.target.value))}
                  />
                </label>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-amber-500"
                      checked={paymentForm.gstIncluded}
                      onChange={(event) => updatePayment('gstIncluded', event.target.checked)}
                    />
                    <div>
                      <span className="block text-sm font-bold text-white">Inclusive of GST</span>
                      <span className="block text-xs text-gray-400">GST is already included in catalog base prices.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Partial Advance Payment */}
            <div className="space-y-4 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm font-bold text-white">Advance Payment (Online only)</h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-amber-500"
                  checked={paymentForm.allowPartial}
                  onChange={(event) => updatePayment('allowPartial', event.target.checked)}
                />
                <div>
                  <span className="block text-sm font-bold text-white">Allow Partial Advance Payment</span>
                  <span className="block text-xs text-gray-400">Customers pay a fraction online to book, balance on job completion.</span>
                </div>
              </label>

              {paymentForm.allowPartial && (
                <div className="mt-3 max-w-xs animate-fadeIn">
                  <label>
                    <span className="mb-2 block text-sm font-medium text-gray-300">Advance Percentage (%)</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="field"
                      value={paymentForm.advancePercentage ?? 30}
                      onChange={(event) => updatePayment('advancePercentage', Number(event.target.value))}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Geocoding Provider settings */}
            <div className="space-y-4 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm font-bold text-white">Location / Geocoding Settings</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-300">Reverse Geocoding Provider</span>
                  <select
                    className="field"
                    value={paymentForm.geocodingProvider || 'Nominatim'}
                    onChange={(event) => updatePayment('geocodingProvider', event.target.value)}
                  >
                    <option value="Nominatim">Nominatim (Free, No Key)</option>
                    <option value="Custom">Custom / Third-Party Provider</option>
                  </select>
                </label>

                {paymentForm.geocodingProvider !== 'Nominatim' && (
                  <label>
                    <span className="mb-2 block text-sm font-medium text-gray-300">API Key</span>
                    <input
                      className="field"
                      placeholder="Enter geocoding provider key"
                      value={paymentForm.geocodingApiKey || ''}
                      onChange={(event) => updatePayment('geocodingApiKey', event.target.value)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary mt-6" disabled={saving}>
            <Save size={17} /> Save Payment Settings
          </button>
        </form>
      )}

      {section === 'tools' && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-navy-900 dark:text-white">
                <Database size={18} /> Developer Tools
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                Seed production-ready default categories, services, product categories, and products into Firestore. Matching document IDs are merged.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" disabled={seeding} onClick={seedDefaultData}>
                <Database size={17} /> {seeding ? 'Seeding...' : 'Seed Default Catalog'}
              </button>
              <button type="button" className="btn-danger" disabled={cleaningCategories} onClick={cleanupInvalidCategories}>
                <Trash2 size={17} /> {cleaningCategories ? 'Cleaning...' : 'Clean Invalid Categories'}
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-white/5">
              <p className="font-black text-navy-900 dark:text-white">{defaultCategories.length}</p>
              <p>service categories</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-white/5">
              <p className="font-black text-navy-900 dark:text-white">{defaultServices.length}</p>
              <p>services</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-white/5">
              <p className="font-black text-navy-900 dark:text-white">{defaultProducts.length}</p>
              <p>products</p>
            </div>
          </div>
          <details className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
            <summary className="cursor-pointer text-sm font-bold text-amber-800 dark:text-amber-200">
              Image Upload Diagnostics
            </summary>
            <div className="mt-4 grid gap-3">
              <p className="text-sm text-amber-700 dark:text-amber-200/80">
                Upload a test image here to verify the ImgBB API key and shared upload pipeline independently from the content forms.
              </p>
              <input type="file" accept="image/*" onChange={testImageUpload} className="block w-full text-sm" />
              {testStatus === 'uploading' && <p className="text-sm font-semibold text-amber-700">Uploading test image...</p>}
              {testStatus === 'success' && (
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Test upload succeeded.</p>
                  <img src={testResult} alt="Test upload" className="mt-2 h-32 w-32 rounded-lg object-cover" />
                  <p className="mt-1 break-all text-xs text-gray-500">{testResult}</p>
                </div>
              )}
              {testStatus === 'error' && (
                <p className="text-sm font-semibold text-red-600">Test upload failed: {testResult}</p>
              )}
            </div>
          </details>
        </section>
      )}
      {section === 'theme' && (
        <form onSubmit={saveTheme} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div>
            <h2 className="font-bold text-navy-900 dark:text-white">Website Colors & Theme</h2>
            <p className="mt-1 text-sm text-gray-500">Customize the colors and styling variables for the website. Changes apply in real-time across the client application.</p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preset Theme Collections</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {themePresets.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => setThemeForm(preset.values)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 hover:border-red-500 transition text-left"
                >
                  <div className="flex h-5 w-full gap-0.5 overflow-hidden rounded">
                    <span className="h-full flex-1" style={{ backgroundColor: preset.values['primary-accent'] }} />
                    <span className="h-full flex-1" style={{ backgroundColor: preset.values['page-bg'] }} />
                    <span className="h-full flex-1" style={{ backgroundColor: preset.values['card-bg'] }} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-300 text-center truncate w-full">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['primary-accent', 'Primary Accent Color'],
              ['primary-accent-hover', 'Primary Accent Hover Color'],
              ['page-bg', 'Page Background Color'],
              ['card-bg', 'Card Background Color'],
              ['primary-text', 'Primary Text Color'],
              ['secondary-text', 'Secondary Text Color'],
              ['heading-text', 'Heading Text Color'],
              ['card-border', 'Card Border Color'],
              ['nav-bg', 'Navigation Bar Background'],
              ['nav-text', 'Navigation Bar Text & Icons'],
              ['announcement-bg', 'Announcement Bar Background'],
              ['announcement-text', 'Announcement Bar Text Color'],
            ].map(([key, label]) => (
              <div key={key} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-white/5 dark:bg-white/5">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-8 w-14 cursor-pointer rounded border-0 bg-transparent"
                    value={themeForm[key] || '#000000'}
                    onChange={(e) => updateTheme(key, e.target.value)}
                  />
                  <input
                    type="text"
                    className="field flex-1 !py-1 text-xs"
                    value={themeForm[key] || ''}
                    onChange={(e) => updateTheme(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
              Save Theme Settings
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowThemePreview(true)}>
              Live Mockup Preview
            </button>
            <button type="button" className="btn-secondary text-red-600 hover:text-red-700" onClick={resetTheme}>
              Reset to Defaults
            </button>
          </div>

          {showThemePreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#0A0A0A] p-6 shadow-xl" style={{ backgroundColor: themeForm['page-bg'], borderColor: themeForm['card-border'] }}>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4" style={{ borderColor: themeForm['card-border'] }}>
                  <h3 className="font-display text-lg font-bold" style={{ color: themeForm['heading-text'] || themeForm['primary-text'] }}>Theme Live Mockup Preview</h3>
                  <button type="button" className="text-gray-400 hover:text-white" onClick={() => setShowThemePreview(false)}>
                    <X size={20} />
                  </button>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: themeForm['nav-bg'], color: themeForm['nav-text'], border: `1px solid ${themeForm['card-border']}` }}>
                    <span className="font-bold">DP Home Electric</span>
                    <div className="flex gap-3 text-xs">
                      <span>Home</span>
                      <span>Services</span>
                      <span>Products</span>
                    </div>
                  </div>

                  <div className="rounded-lg p-2 text-center text-xs font-semibold" style={{ backgroundColor: themeForm['announcement-bg'], color: themeForm['announcement-text'] }}>
                    ⚡ Same-Day Service Available — Book Before 2 PM
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl p-4 border" style={{ backgroundColor: themeForm['card-bg'], borderColor: themeForm['card-border'] }}>
                      <h4 className="font-bold text-sm" style={{ color: themeForm['heading-text'] || themeForm['primary-text'] }}>Ceiling Fan Repair</h4>
                      <p className="text-xs mt-1" style={{ color: themeForm['secondary-text'] }}>Doorstep service with 3 months warranty.</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-black" style={{ color: themeForm['primary-text'] }}>Rs. 149</span>
                        <button type="button" className="rounded px-2.5 py-1 text-xs font-bold text-white transition" style={{ backgroundColor: themeForm['primary-accent'] }}>Add</button>
                      </div>
                    </div>

                    <div className="rounded-2xl p-4 border" style={{ backgroundColor: themeForm['card-bg'], borderColor: themeForm['card-border'] }}>
                      <h4 className="font-bold text-sm" style={{ color: themeForm['heading-text'] || themeForm['primary-text'] }}>Switchboard Fitting</h4>
                      <p className="text-xs mt-1" style={{ color: themeForm['secondary-text'] }}>Doorstep service with 3 months warranty.</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-black" style={{ color: themeForm['primary-text'] }}>Rs. 199</span>
                        <button type="button" className="rounded px-2.5 py-1 text-xs font-bold text-white transition" style={{ backgroundColor: themeForm['primary-accent'] }}>Add</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" className="btn-primary" style={{ backgroundColor: themeForm['primary-accent'] }} onClick={() => setShowThemePreview(false)}>
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </section>
  )
}
