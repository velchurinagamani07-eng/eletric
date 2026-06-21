require('dotenv').config()

const { admin, db, isFirebaseAdminConfigured } = require('../services/firebaseAdmin')

const categories = [
  { id: 'fans', name: 'Fans', icon: 'Fan', order: 1, isActive: true },
  { id: 'wiring', name: 'Wiring', icon: 'Cable', order: 2, isActive: true },
  { id: 'sockets', name: 'Sockets', icon: 'PlugZap', order: 3, isActive: true },
  { id: 'mcb', name: 'MCB', icon: 'CircuitBoard', order: 4, isActive: true },
  { id: 'lights', name: 'Lights', icon: 'Lightbulb', order: 5, isActive: true },
  { id: 'backup', name: 'Backup', icon: 'BatteryCharging', order: 6, isActive: true },
  { id: 'security', name: 'Security', icon: 'Cctv', order: 7, isActive: true },
]

const services = [
  ['fan-installation', 'Fan Installation', 'fans', 299, 'fan.png'],
  ['fan-repair', 'Fan Repair', 'fans', 199, 'fan-repair.png'],
  ['fan-replacement', 'Fan Replacement', 'fans', 349, 'fan.png'],
  ['fan-removal', 'Fan Removal', 'fans', 149, 'fan.png'],
  ['wiring-rewiring', 'Wiring & Rewiring', 'wiring', 499, 'wiring.png'],
  ['socket-installation', 'Socket Installation', 'sockets', 149, 'socket.png'],
  ['switch-board-repair', 'Switch Board Repair', 'sockets', 199, 'switchboard.png'],
  ['mcb-fuse-box', 'MCB/Fuse Box', 'mcb', 349, 'mcb.png'],
  ['light-installation', 'Light Installation', 'lights', 199, 'light.png'],
  ['geyser-wiring', 'Geyser Wiring', 'wiring', 299, 'geyser.png'],
  ['ac-wiring-fitting', 'AC Wiring & Fitting', 'wiring', 599, 'ac.png'],
  ['power-backup-inverter', 'Power Backup / Inverter', 'backup', 799, 'inverter.png'],
  ['earthing-work', 'Earthing Work', 'wiring', 999, 'earthing.png'],
  ['cctv-wiring', 'CCTV Wiring', 'security', 499, 'cctv.png'],
  ['short-circuit-repair', 'Short Circuit Repair', 'mcb', 399, 'short-circuit.png'],
]

async function seed() {
  if (!isFirebaseAdminConfigured || !db) {
    throw new Error('Firebase Admin is not configured. Set server .env first.')
  }

  const batch = db.batch()
  const now = admin.firestore.FieldValue.serverTimestamp()

  for (const category of categories) {
    batch.set(db.collection('categories').doc(category.id), { ...category, createdAt: now }, { merge: true })
  }

  for (const [slug, name, category, basePrice, imageName] of services) {
    batch.set(
      db.collection('services').doc(slug),
      {
        slug,
        name,
        category,
        description: `${name} by verified electricians with transparent pricing, safety checks, and 1 Month warranty.`,
        basePrice,
        imageURL: `/default-images/services/${imageName}`,
        duration: '45-90 min',
        isActive: true,
        createdAt: now,
      },
      { merge: true },
    )
  }

  batch.set(db.collection('settings').doc('contact'), {
    phone: '9493745479',
    whatsapp: '9493745479',
    email: 'support@homeelectricservices.in',
    address: 'Tuni, Andhra Pradesh',
    owner: 'M Dileep Kumar',
  })

  batch.set(db.collection('settings').doc('seo'), {
    homeTitle: 'Home Electric Services - Expert Electricians in Tuni',
    homeDescription: 'Book licensed electricians in Tuni with 1 Month warranty.',
    homeKeywords: 'electrician Tuni, home electrical services, fan installation Tuni, wiring repair',
  })

  batch.set(db.collection('settings').doc('hero'), {
    headline: 'Expert Home Electrical Services in Tuni',
    subheadline: 'Fast, reliable electricians for fan installation, wiring, sockets, AC fitting, inverter work and emergency repairs with a 1 Month warranty.',
    ctaText: 'Book a Service',
    ctaLink: '/booking',
    secondaryCtaText: 'View Services',
    secondaryCtaLink: '/services',
    badgeText: 'Trusted Electricians in Tuni',
    badgeText1: '1 Month Warranty',
    badgeText2: '50+ Workers',
    badgeText3: 'Same-day Service',
    badgeText4: 'Verified',
    customers: 500,
    workers: 50,
    warranty: '1 Month Warranty',
    rating: '5-Star Rated',
    isActive: true,
  })

  batch.set(db.collection('settings').doc('completionCoupons'), {
    fans: { value: 100 },
    wiring: { value: 150 },
    sockets: { value: 100 },
    mcb: { value: 100 },
  })

  await batch.commit()
  console.log(`Seeded ${categories.length} categories and ${services.length} services.`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
