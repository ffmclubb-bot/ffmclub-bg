// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAb_D8haJLCMf7L2efrl0ncZF7KWwavINg",
  authDomain: "ffm-club-web.firebaseapp.com",
  projectId: "ffm-club-web",
  storageBucket: "ffm-club-web.firebasestorage.app",
  messagingSenderId: "162798982034",
  appId: "1:162798982034:web:f2e15cf9175cdf11a9674b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
