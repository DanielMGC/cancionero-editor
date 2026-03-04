// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAb-8VGxfu6uYBXE4gelQwZl_d9ERQNU5k",
  authDomain: "cancionero-carmen.firebaseapp.com",
  projectId: "cancionero-carmen",
  storageBucket: "cancionero-carmen.firebasestorage.app",
  messagingSenderId: "904610301064",
  appId: "1:904610301064:web:dde4489d7a4b5e488fcb3d",
  measurementId: "G-0GF56RBYRJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

// Export the database instance so we can use it in our pages
export const db = getFirestore(app);