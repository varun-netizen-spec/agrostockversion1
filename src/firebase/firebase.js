import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// These should ideally be environment variables in a real production app.
const firebaseConfig = {
  apiKey: "AIzaSyAJ6Z4fJa96Y-RgsdUzzVtoqFWDZUTfmAU",
  authDomain: "agrostock-f420f.firebaseapp.com",
  projectId: "agrostock-f420f",
  storageBucket: "agrostock-f420f.firebasestorage.app",
  messagingSenderId: "102073330816",
  appId: "1:102073330816:web:59be903608540e859f4a65"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
