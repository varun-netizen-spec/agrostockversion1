import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// These should ideally be environment variables in a real production app.
const firebaseConfig = {
  apiKey: 123,
  authDomain: 6678,
  projectId: 345,
  storageBucket: 345,
  messagingSenderId: 789,
  appId: 5679
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
