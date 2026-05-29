const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function backfillRequests() {
  const requestsSnap = await db.collection('requests').get();
  for (const doc of requestsSnap.docs) {
    const data = doc.data();
    const updates = {};

    // Backfill clientUserId if missing and clientId exists
    if (!data.clientUserId && data.clientId) {
      const userDoc = await db.collection('users').doc(data.clientId).get();
      if (userDoc.exists) {
        updates.clientUserId = userDoc.data().userId;
      }
    }

    // Backfill helpmateUserId if missing and helpmateId exists
    if (!data.helpmateUserId && data.helpmateId) {
      const userDoc = await db.collection('users').doc(data.helpmateId).get();
      if (userDoc.exists) {
        updates.helpmateUserId = userDoc.data().userId;
      }
    }

    // Backfill clientPhone if missing (optional)
    if (!data.clientPhone && data.clientId) {
      const userDoc = await db.collection('users').doc(data.clientId).get();
      if (userDoc.exists) {
        updates.clientPhone = userDoc.data().phone || '';
      }
    }

    // Backfill helpmatePhone if missing
    if (!data.helpmatePhone && data.helpmateId) {
      const userDoc = await db.collection('users').doc(data.helpmateId).get();
      if (userDoc.exists) {
        updates.helpmatePhone = userDoc.data().phone || '';
      }
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`Updated request ${doc.id}:`, updates);
    }
  }
  console.log('Backfill complete.');
}

backfillRequests().catch(console.error);