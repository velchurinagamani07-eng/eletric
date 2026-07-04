const path = require('path');
require('dotenv').config();

const { admin, db } = require('../services/firebaseAdmin');

async function migrate() {
  console.log("Starting Lights and Switches separation migration...");

  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Update "lights" category
  const lightsRef = db.collection('categories').doc('lights');
  await lightsRef.set({
    name: 'Lights',
    slug: 'lights',
    icon: 'Lightbulb',
    order: 5,
    updatedAt: now
  }, { merge: true });
  console.log("Updated 'lights' category doc.");

  // 2. Create "switches" category
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
  console.log("Created/Updated 'switches' category doc.");

  // 3. Shift order of other categories to accommodate switches at order 6
  const categoriesSnap = await db.collection('categories').get();
  for (const doc of categoriesSnap.docs) {
    const data = doc.data();
    if (doc.id !== 'lights' && doc.id !== 'switches' && doc.id !== 'all') {
      const currentOrder = Number(data.order || 0);
      if (currentOrder >= 6) {
        const nextOrder = currentOrder + 1;
        await doc.ref.update({
          order: nextOrder,
          updatedAt: now
        });
        console.log(`Shifted category '${doc.id}' order from ${currentOrder} to ${nextOrder}`);
      }
    }
  }

  // 4. Move "switch-socket-repair" to switches category
  const switchRepairRef = db.collection('services').doc('switch-socket-repair');
  const switchRepairSnap = await switchRepairRef.get();
  if (switchRepairSnap.exists) {
    await switchRepairRef.update({
      category: 'switches',
      categorySlug: 'switches-sockets',
      updatedAt: now
    });
    console.log("Moved service 'switch-socket-repair' to category 'switches'.");
  } else {
    // If it doesn't exist, seed it under switches
    await switchRepairRef.set({
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
    });
    console.log("Seeded default service 'switch-socket-repair' under switches category.");
  }

  // 5. Update any other services whose names contain "switch" or "socket" in lights/wiring category
  const servicesSnap = await db.collection('services').get();
  for (const doc of servicesSnap.docs) {
    const data = doc.data();
    const serviceName = String(data.name || '').toLowerCase();
    const currentCat = String(data.category || '').toLowerCase();
    if (
      doc.id !== 'switch-socket-repair' &&
      (currentCat === 'lights' || currentCat === 'wiring') &&
      (serviceName.includes('switch') || serviceName.includes('socket'))
    ) {
      await doc.ref.update({
        category: 'switches',
        categorySlug: 'switches-sockets',
        updatedAt: now
      });
      console.log(`Auto-moved service '${doc.id}' (${data.name}) to category 'switches'.`);
    }
  }

  console.log("Migration completed successfully!");
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
