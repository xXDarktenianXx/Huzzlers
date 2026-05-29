const admin = require('firebase-admin');

// Download your service account key from Firebase Console:
// Project Settings → Service Accounts → Generate New Private Key
// Save the JSON file in your project root (e.g., serviceAccountKey.json)
const serviceAccount = require('./serviceAccountKey.json'); // adjust path if needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // If you have a specific database URL, add it here; otherwise omit
});

const db = admin.firestore();

function generateUserId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function addUserIds() {
  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (!data.userId) {
      let userId = generateUserId();
      let unique = false;
      while (!unique) {
        const existing = await db.collection('users').where('userId', '==', userId).get();
        if (existing.empty) {
          unique = true;
        } else {
          userId = generateUserId();
        }
      }
      await doc.ref.update({ userId });
      console.log(`Added userId ${userId} to ${doc.id} (${data.fullName || 'unknown'})`);
    } else {
      console.log(`User ${doc.id} already has userId: ${data.userId}`);
    }
  }
  console.log('Finished updating users.');
}

addUserIds().catch(console.error);