// Messaging/Chat System
import { db } from './firebase-config.js';
import { 
    collection, 
    doc,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Create or get conversation between two users
export async function getOrCreateConversation(user1Id, user2Id) {
    try {
        // Create a consistent conversation ID (sorted user IDs)
        const conversationId = [user1Id, user2Id].sort().join('_');
        
        const conversationRef = doc(db, "conversations", conversationId);
        const conversationSnap = await getDoc(conversationRef);
        
        if (!conversationSnap.exists()) {
            // Create new conversation
            await setDoc(conversationRef, {
                participants: [user1Id, user2Id],
                createdAt: serverTimestamp(),
                lastMessage: null,
                lastMessageTime: null
            });
        }
        
        return { success: true, conversationId: conversationId };
    } catch (error) {
        console.error("Get conversation error:", error);
        return { success: false, error: error.message };
    }
}

// Send a message
export async function sendMessage(conversationId, senderId, recipientId, messageText) {
    try {
        const messagesRef = collection(db, "conversations", conversationId, "messages");
        
        await addDoc(messagesRef, {
            senderId: senderId,
            recipientId: recipientId,
            text: messageText,
            timestamp: serverTimestamp(),
            read: false
        });
        
        // Update conversation with last message
        const conversationRef = doc(db, "conversations", conversationId);
        await updateDoc(conversationRef, {
            lastMessage: messageText,
            lastMessageTime: serverTimestamp()
        });
        
        return { success: true };
    } catch (error) {
        console.error("Send message error:", error);
        return { success: false, error: error.message };
    }
}

// Get messages in real-time
export function listenToMessages(conversationId, callback) {
    try {
        const messagesRef = collection(db, "conversations", conversationId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));
        
        // Listen to real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            callback(messages);
        });
        
        return unsubscribe;
    } catch (error) {
        console.error("Listen to messages error:", error);
        return null;
    }
}

// Get all conversations for a user
export async function getUserConversations(userId) {
    try {
        const conversationsRef = collection(db, "conversations");
        const q = query(
            conversationsRef, 
            where("participants", "array-contains", userId),
            orderBy("lastMessageTime", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const conversations = [];
        
        querySnapshot.forEach((doc) => {
            conversations.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, conversations: conversations };
    } catch (error) {
        console.error("Get conversations error:", error);
        return { success: false, error: error.message };
    }
}

// Mark messages as read
export async function markMessagesAsRead(conversationId, userId) {
    try {
        const messagesRef = collection(db, "conversations", conversationId, "messages");
        const q = query(
            messagesRef, 
            where("recipientId", "==", userId),
            where("read", "==", false)
        );
        
        const querySnapshot = await getDocs(q);
        
        const updatePromises = [];
        querySnapshot.forEach((doc) => {
            updatePromises.push(updateDoc(doc.ref, { read: true }));
        });
        
        await Promise.all(updatePromises);
        
        return { success: true };
    } catch (error) {
        console.error("Mark as read error:", error);
        return { success: false, error: error.message };
    }
}

// Get unread message count
export async function getUnreadCount(userId) {
    try {
        const conversationsRef = collection(db, "conversations");
        const q = query(
            conversationsRef,
            where("participants", "array-contains", userId)
        );
        
        const querySnapshot = await getDocs(q);
        let totalUnread = 0;
        
        for (const conversationDoc of querySnapshot.docs) {
            const messagesRef = collection(db, "conversations", conversationDoc.id, "messages");
            const messagesQuery = query(
                messagesRef,
                where("recipientId", "==", userId),
                where("read", "==", false)
            );
            
            const messagesSnapshot = await getDocs(messagesQuery);
            totalUnread += messagesSnapshot.size;
        }
        
        return { success: true, count: totalUnread };
    } catch (error) {
        console.error("Get unread count error:", error);
        return { success: false, error: error.message };
    }
}
