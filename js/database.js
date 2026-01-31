// Database Operations
import { db } from './firebase-config.js';
import { 
    collection, 
    doc,
    getDoc,
    getDocs,
    query, 
    where, 
    orderBy,
    limit,
    updateDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Get all users (for gallery)
export async function getAllUsers(limitCount = 50) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"), limit(limitCount));
        const querySnapshot = await getDocs(q);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, users: users };
    } catch (error) {
        console.error("Get users error:", error);
        return { success: false, error: error.message };
    }
}

// Search users with filters
export async function searchUsers(filters) {
    try {
        const usersRef = collection(db, "users");
        let q = query(usersRef);
        
        // Apply filters
        if (filters.accountType && filters.accountType !== "all") {
            q = query(q, where("accountType", "==", filters.accountType));
        }
        
        if (filters.city && filters.city !== "all") {
            q = query(q, where("city", "==", filters.city));
        }
        
        if (filters.verified) {
            q = query(q, where("verified", "==", true));
        }
        
        const querySnapshot = await getDocs(q);
        let users = [];
        
        querySnapshot.forEach((doc) => {
            const userData = { id: doc.id, ...doc.data() };
            
            // Filter by age range (client-side)
            if (filters.ageFrom && userData.age < filters.ageFrom) return;
            if (filters.ageTo && userData.age > filters.ageTo) return;
            
            users.push(userData);
        });
        
        return { success: true, users: users };
    } catch (error) {
        console.error("Search users error:", error);
        return { success: false, error: error.message };
    }
}

// Get user by ID
export async function getUserById(userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return { success: true, user: { id: userSnap.id, ...userSnap.data() } };
        } else {
            return { success: false, error: "User not found" };
        }
    } catch (error) {
        console.error("Get user error:", error);
        return { success: false, error: error.message };
    }
}

// Like a user
export async function likeUser(currentUserId, targetUserId) {
    try {
        const currentUserRef = doc(db, "users", currentUserId);
        await updateDoc(currentUserRef, {
            likes: arrayUnion(targetUserId)
        });
        
        // Check for mutual like (match)
        const targetUserRef = doc(db, "users", targetUserId);
        const targetUserSnap = await getDoc(targetUserRef);
        
        if (targetUserSnap.exists()) {
            const targetUserLikes = targetUserSnap.data().likes || [];
            if (targetUserLikes.includes(currentUserId)) {
                // It's a match!
                return { success: true, match: true };
            }
        }
        
        return { success: true, match: false };
    } catch (error) {
        console.error("Like user error:", error);
        return { success: false, error: error.message };
    }
}

// Unlike a user
export async function unlikeUser(currentUserId, targetUserId) {
    try {
        const currentUserRef = doc(db, "users", currentUserId);
        await updateDoc(currentUserRef, {
            likes: arrayRemove(targetUserId)
        });
        return { success: true };
    } catch (error) {
        console.error("Unlike user error:", error);
        return { success: false, error: error.message };
    }
}

// Add to favorites
export async function addToFavorites(currentUserId, targetUserId) {
    try {
        const currentUserRef = doc(db, "users", currentUserId);
        await updateDoc(currentUserRef, {
            favorites: arrayUnion(targetUserId)
        });
        return { success: true };
    } catch (error) {
        console.error("Add to favorites error:", error);
        return { success: false, error: error.message };
    }
}

// Remove from favorites
export async function removeFromFavorites(currentUserId, targetUserId) {
    try {
        const currentUserRef = doc(db, "users", currentUserId);
        await updateDoc(currentUserRef, {
            favorites: arrayRemove(targetUserId)
        });
        return { success: true };
    } catch (error) {
        console.error("Remove from favorites error:", error);
        return { success: false, error: error.message };
    }
}

// Get user's likes
export async function getUserLikes(userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const likes = userSnap.data().likes || [];
            
            // Get full user data for each like
            const likedUsers = [];
            for (const likedUserId of likes) {
                const result = await getUserById(likedUserId);
                if (result.success) {
                    likedUsers.push(result.user);
                }
            }
            
            return { success: true, users: likedUsers };
        }
        
        return { success: false, error: "User not found" };
    } catch (error) {
        console.error("Get likes error:", error);
        return { success: false, error: error.message };
    }
}

// Get user's favorites
export async function getUserFavorites(userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const favorites = userSnap.data().favorites || [];
            
            // Get full user data for each favorite
            const favoriteUsers = [];
            for (const favUserId of favorites) {
                const result = await getUserById(favUserId);
                if (result.success) {
                    favoriteUsers.push(result.user);
                }
            }
            
            return { success: true, users: favoriteUsers };
        }
        
        return { success: false, error: "User not found" };
    } catch (error) {
        console.error("Get favorites error:", error);
        return { success: false, error: error.message };
    }
}

// Get matches (mutual likes)
export async function getMatches(userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const myLikes = userSnap.data().likes || [];
            const matches = [];
            
            // Check each liked user to see if they liked back
            for (const likedUserId of myLikes) {
                const likedUserRef = doc(db, "users", likedUserId);
                const likedUserSnap = await getDoc(likedUserRef);
                
                if (likedUserSnap.exists()) {
                    const theirLikes = likedUserSnap.data().likes || [];
                    if (theirLikes.includes(userId)) {
                        matches.push({ id: likedUserSnap.id, ...likedUserSnap.data() });
                    }
                }
            }
            
            return { success: true, matches: matches };
        }
        
        return { success: false, error: "User not found" };
    } catch (error) {
        console.error("Get matches error:", error);
        return { success: false, error: error.message };
    }
}
