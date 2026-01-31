// Authentication Functions
import { auth, db, storage } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc,
    updateDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Register new user
export async function registerUser(email, password, userData) {
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);

        // Create user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: email,
            username: userData.username,
            accountType: userData.accountType,
            age: userData.age,
            city: userData.city,
            about: userData.about || "",
            interests: userData.interests || "",
            verified: false,
            createdAt: serverTimestamp(),
            photoURL: "",
            profileViews: 0,
            likes: [],
            favorites: []
        });

        return { success: true, user: user };
    } catch (error) {
        console.error("Registration error:", error);
        return { success: false, error: error.message };
    }
}

// Login user
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: error.message };
    }
}

// Logout user
export async function logoutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Logout error:", error);
        return { success: false, error: error.message };
    }
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}

// Check auth state
export function checkAuthState(callback) {
    onAuthStateChanged(auth, callback);
}

// Get user profile
export async function getUserProfile(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: "User not found" };
        }
    } catch (error) {
        console.error("Get profile error:", error);
        return { success: false, error: error.message };
    }
}

// Update user profile
export async function updateUserProfile(uid, updates) {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, updates);
        return { success: true };
    } catch (error) {
        console.error("Update profile error:", error);
        return { success: false, error: error.message };
    }
}

// Upload profile photo
export async function uploadProfilePhoto(uid, file) {
    try {
        const storageRef = ref(storage, `profile-photos/${uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        
        // Update user profile with photo URL
        await updateUserProfile(uid, { photoURL: photoURL });
        await updateProfile(auth.currentUser, { photoURL: photoURL });
        
        return { success: true, photoURL: photoURL };
    } catch (error) {
        console.error("Upload photo error:", error);
        return { success: false, error: error.message };
    }
}

// Reset password
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error("Reset password error:", error);
        return { success: false, error: error.message };
    }
}

// Increment profile views
export async function incrementProfileViews(uid) {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const currentViews = userSnap.data().profileViews || 0;
            await updateDoc(userRef, {
                profileViews: currentViews + 1
            });
        }
    } catch (error) {
        console.error("Increment views error:", error);
    }
}
