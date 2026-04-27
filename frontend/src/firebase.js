import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// The user must fill these in from their Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSy_MOCK_API_KEY",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:mock-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
