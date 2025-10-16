import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEfFhtySiE68hfdJoxTWK1Bob2vvRxf7U",
  authDomain: "csse-project-8bc4e.firebaseapp.com",
  projectId: "csse-project-8bc4e",
  storageBucket: "csse-project-8bc4e.firebasestorage.app",
  messagingSenderId: "888026770943",
  appId: "1:888026770943:web:bc02df14f95526dfd48bca",
  measurementId: "G-XRB90ZWKF0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
