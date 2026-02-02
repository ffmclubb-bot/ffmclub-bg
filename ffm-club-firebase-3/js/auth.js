// Authentication Functions for FFM Club
// Handles user registration, login, password reset, and logout

import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Register a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {Object} userData - Additional user data (username, age, city, etc.)
 * @returns {Object} - Result object with success status and user data or error
 */
export async function registerUser(email, password, userData) {
    try {
        // Create user account in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);

        // Store additional user data in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            email: email,
            username: userData.username || '',
            accountType: userData.accountType || '',
            age: userData.age || null,
            city: userData.city || '',
            about: userData.about || '',
            interests: userData.interests || '',
            profileImage: '',
            isVerified: false,
            emailVerified: user.emailVerified,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });

        return {
            success: true,
            user: user,
            message: 'Регистрацията е успешна! Проверете email-а си за верификация.'
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
}

/**
 * Login user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Object} - Result object with success status and user data or error
 */
export async function loginUser(email, password) {
    try {
        // Sign in user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update last login timestamp
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            lastLogin: serverTimestamp()
        }, { merge: true });

        return {
            success: true,
            user: user,
            message: 'Успешен вход!'
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
}

/**
 * Logout current user
 * @returns {Object} - Result object with success status or error
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        return {
            success: true,
            message: 'Успешен изход!'
        };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            error: 'Грешка при изход от профила.'
        };
    }
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Object} - Result object with success status or error
 */
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return {
            success: true,
            message: 'Email за възстановяване на паролата е изпратен!'
        };
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
}

/**
 * Get current user data from Firestore
 * @returns {Object|null} - User data or null if not logged in
 */
export async function getCurrentUserData() {
    try {
        const user = auth.currentUser;
        if (!user) {
            return null;
        }

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return {
                uid: user.uid,
                ...userDoc.data()
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 * @param {Function} callback - Callback function to handle auth state changes
 */
export function checkAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        if (callback) {
            callback(user);
        }
    });
}

/**
 * Protect pages that require authentication
 * Redirects to login page if user is not authenticated
 */
export function protectPage() {
    checkAuthState((user) => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });
}

/**
 * Convert Firebase error codes to user-friendly Bulgarian messages
 * @param {string} errorCode - Firebase error code
 * @returns {string} - User-friendly error message in Bulgarian
 */
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Този email вече е регистриран.',
        'auth/invalid-email': 'Невалиден email адрес.',
        'auth/operation-not-allowed': 'Операцията не е разрешена.',
        'auth/weak-password': 'Паролата е твърде слаба. Използвайте минимум 8 символа.',
        'auth/user-disabled': 'Този акаунт е деактивиран.',
        'auth/user-not-found': 'Не е намерен потребител с този email.',
        'auth/wrong-password': 'Грешна парола.',
        'auth/invalid-credential': 'Невалидни данни за вход. Проверете email и парола.',
        'auth/too-many-requests': 'Твърде много опити. Опитайте отново по-късно.',
        'auth/network-request-failed': 'Грешка в мрежата. Проверете интернет връзката си.'
    };

    return errorMessages[errorCode] || 'Възникна грешка. Моля, опитайте отново.';
}

// Make functions available globally for inline scripts
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.resetPassword = resetPassword;
window.getCurrentUserData = getCurrentUserData;
window.checkAuthState = checkAuthState;
window.protectPage = protectPage;
