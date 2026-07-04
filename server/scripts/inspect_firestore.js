const path = require('path');
require('dotenv').config();

const { db } = require('../services/firebaseAdmin');

async function inspect() {
  console.log("Connecting to Firestore...");
  
  const productsSnapshot = await db.collection('products').get();
  console.log("\n--- Products in Firestore ---");
  productsSnapshot.forEach(doc => {
    console.log(`ID: ${doc.id} =>`, doc.data());
  });
}

inspect().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
