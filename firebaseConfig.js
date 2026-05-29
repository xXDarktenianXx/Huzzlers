// firebaseConfig.js
import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// With @react-native-firebase, the app is auto-initialized from google-services.json
// You just import and use auth/firestore directly

export { auth, firestore };