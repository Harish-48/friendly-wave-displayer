
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { firebaseConfig } from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Connect to emulators if in development environment
if (import.meta.env.DEV) {
  try {
    // Use emulators if they're running (for local development)
    // Comment these out if you want to use production Firebase
    // connectFirestoreEmulator(db, '127.0.0.1', 8080);
    // connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.error('Failed to connect to Firebase emulators:', error);
  }
}

// Export Firebase app instance
export const firebaseApp = app;
