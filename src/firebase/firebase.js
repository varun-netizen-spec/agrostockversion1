import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// These should ideally be environment variables in a real production app.
const firebaseConfig = {
  apiKey: "AIzaSyDaESotubVshORiR7HSzX33ToWCgBjOjYA",
  authDomain: "agrostock-b2647.firebaseapp.com",
  projectId: "agrostock-b2647",
  storageBucket: "agrostock-b2647.firebasestorage.app",
  messagingSenderId: "814448518129",
  appId: "1:814448518129:web:95c2d36c7a33d08ce35a50"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
