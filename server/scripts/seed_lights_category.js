const path = require('path');
require('dotenv').config();

const { admin, db } = require('../services/firebaseAdmin');

async function seed() {
  console.log("Seeding separated lights and switches categories and services...");

  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Ensure "lights" category document exists
  const lightsRef = db.collection('categories').doc('lights');
  await lightsRef.set({
    id: 'lights',
    name: 'Lights',
    slug: 'lights',
    icon: 'Light',
    isActive: true,
    order: 5,
    updatedAt: now
  }, { merge: true });
  console.log("Lights category verified/updated.");

  // 2. Ensure "switches" category document exists
  const switchesRef = db.collection('categories').doc('switches');
  await switchesRef.set({
    id: 'switches',
    name: 'Switches & Sockets',
    slug: 'switches-sockets',
    icon: 'PlugZap',
    isActive: true,
    order: 6,
    updatedAt: now
  }, { merge: true });
  console.log("Switches category verified/updated.");

  // 3. Set default services
  const defaultServices = [
    {
      id: 'switch-socket-repair',
      name: 'Switch/Socket Repair',
      category: 'switches',
      categorySlug: 'switches-sockets',
      basePrice: 199,
      salePrice: 149,
      duration: '30 mins',
      isActive: true,
      description: 'Switch/Socket Repair is handled by verified electricians in Tuni with safe diagnosis, clean workmanship, transparent pricing, and a 1 Month service warranty.',
      shortDescription: 'Switch/Socket Repair is handled by verified electricians in Tuni with safe diagnosis, clean workmanship, transparent',
      inclusions: ['Diagnosis', 'Replacement', 'Testing'],
      includes: ['Diagnosis', 'Replacement', 'Testing'],
      images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=82'],
      imageURL: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=82',
      warranty: '1 Month',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'light-point-installation',
      name: 'Light Point Installation',
      category: 'lights',
      categorySlug: 'lights',
      basePrice: 199,
      salePrice: 149,
      duration: '45 mins',
      isActive: true,
      description: 'Light Point Installation is handled by verified electricians in Tuni with safe diagnosis, clean workmanship, transparent pricing, and a 1 Month service warranty.',
      shortDescription: 'Light Point Installation is handled by verified electricians in Tuni with safe diagnosis, clean workmanship, transparent',
      inclusions: ['Fixture mounting', 'Switch testing', 'Wiring'],
      includes: ['Fixture mounting', 'Switch testing', 'Wiring'],
      images: ['https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=1000&q=82'],
      imageURL: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=1000&q=82',
      warranty: '1 Month',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'led-batten-fitting',
      name: 'LED Batten Fitting',
      category: 'lights',
      categorySlug: 'lights',
      basePrice: 199,
      salePrice: 149,
      duration: '30 mins',
      isActive: true,
      description: 'LED Batten Fitting is handled by verified electricians in Tuni with safe diagnosis, clean workmanship, transparent pricing, and a 1 Month service warranty.',
      shortDescription: 'LED Batten Fitting is handled by verified electricians in Tuni with safe diagnosis, clean workmanship, transparent',
      inclusions: ['Fitting', 'Wiring', 'Testing'],
      includes: ['Fitting', 'Wiring', 'Testing'],
      images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1000&q=82'],
      imageURL: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1000&q=82',
      warranty: '1 Month',
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const s of defaultServices) {
    await db.collection('services').doc(s.id).set(s, { merge: true });
    console.log(`Service ${s.name} created/updated.`);
  }

  console.log("Seeding complete!");
}

seed().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
