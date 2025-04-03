import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
    UserCredential,
} from 'firebase/auth';
import {
    getDatabase,
    ref,
    onValue,
    push,
    update,
    get,
    serverTimestamp,
    Unsubscribe,
    onDisconnect,
    set,
} from 'firebase/database';

import { auth } from './firebase-config';

import { ChatData, FormattedUser, UserData } from '~/lib/types';

export interface FirebaseUserResponse {
    user: User;
}

export const getCurrentUser = async () => {
    try {
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user ? { user } : null);
            });
        });
    } catch (error) {
        console.error('[error getting user] ==>', error);
        return null;
    }
};

export async function login(
    email: string,
    password: string
): Promise<FirebaseUserResponse | undefined> {
    try {
        const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user };
    } catch (e) {
        console.error('[error logging in] ==>', e);
        throw e;
    }
}

export async function logout(): Promise<void> {
    try {
        await signOut(auth);
    } catch (e) {
        console.error('[error logging out] ==>', e);
        throw e;
    }
}

export async function register(
    email: string,
    password: string,
    name?: string
): Promise<FirebaseUserResponse | undefined> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
            await updateProfile(userCredential.user, { displayName: name });
        }
        return { user: userCredential.user };
    } catch (e) {
        console.error('[error registering] ==>', e);
        throw e;
    }
}

const db = getDatabase();
const formatFirebaseUser = (userId: string, userData: UserData): FormattedUser => {
    return {
        id: userId,
        email: userData.email,
        username: userData.username,
    };
};

export const listenToUserChats = (
    userId: string,
    callback: (chats: ChatData[], error?: Error) => void
): Unsubscribe => {
    const userChatsRef = ref(db, `users/${userId}/chats`);

    const unsubscribe = onValue(
        userChatsRef,
        async (snapshot) => {
            const chatIdsData = snapshot.val();
            if (chatIdsData) {
                const chatIds = Object.keys(chatIdsData);
                // Fetch details for each chat concurrently
                const chatPromises = chatIds.map(async (chatId) => {
                    try {
                        const chatRef = ref(db, `chats/${chatId}`);
                        const chatSnapshot = await get(chatRef);
                        if (chatSnapshot.exists()) {
                            const chatData = chatSnapshot.val();
                            return { id: chatId, ...chatData };
                        }
                        console.warn(`Chat data for ID ${chatId} not found.`);
                        return null;
                    } catch (err: any) {
                        console.error(`Error fetching chat ${chatId}:`, err);
                        return null;
                    }
                });

                try {
                    const chats = await Promise.all(chatPromises);
                    const validChats = chats.filter((chat): chat is ChatData => chat !== null);
                    callback(validChats);
                } catch (err: any) {
                    console.error('Error processing chat promises:', err);
                    callback([], err);
                }
            } else {
                callback([]);
            }
        },
        (error: Error) => {
            console.error('Error listening to user chats:', error);
            callback([], error);
        }
    );

    return unsubscribe;
};

export const fetchAllUsers = async (currentUserId: string): Promise<FormattedUser[]> => {
    const usersRef = ref(db, 'users');
    try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const usersData = snapshot.val() as Record<string, UserData>;
            const formattedUsers = Object.entries(usersData)
                .map(([userId, userData]) => formatFirebaseUser(userId, userData))
                .filter((user) => user.id !== currentUserId);
            return formattedUsers;
        } else {
            return [];
        }
    } catch (err: any) {
        console.error('Error fetching all users:', err);
        throw new Error(err.message || 'Failed to fetch users.');
    }
};

export const createChat = async (currentUserId: string, otherUserId: string): Promise<string> => {
    const chatRef = push(ref(db, 'chats'));
    const chatId = chatRef.key;

    if (!chatId) {
        throw new Error('Could not generate chat ID');
    }

    const participantsData = {
        [currentUserId]: true,
        [otherUserId]: true,
    };

    const newChatData = {
        participants: participantsData,
        createdAt: serverTimestamp(),
        lastMessage: null,
    };

    const updates: { [key: string]: any } = {};
    updates[`/chats/${chatId}`] = newChatData;
    updates[`/users/${currentUserId}/chats/${chatId}`] = true;
    updates[`/users/${otherUserId}/chats/${chatId}`] = true;

    try {
        await update(ref(db), updates);
        console.log('Chat created successfully in service with ID:', chatId);
        return chatId;
    } catch (error: any) {
        console.error('Error creating chat in service:', error);
        throw new Error(error.message || 'Failed to create chat.');
    }
};

export const updateUserPresence = (userId: string) => {
    if (!userId) return;

    const userStatusRef = ref(db, `/status/${userId}`);
    const connectedRef = ref(db, '.info/connected');

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            set(userStatusRef, {
                online: true,
                last_seen: serverTimestamp(),
            });
            onDisconnect(userStatusRef).set({
                online: false,
                last_seen: serverTimestamp(),
            });
        }
    });
};

export const listenToUserStatus = (
    userId: string,
    callback: (status: { online: boolean; last_seen: number } | null) => void
): Unsubscribe => {
    const userStatusRef = ref(db, `/status/${userId}`);
    return onValue(
        userStatusRef,
        (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val() as { online: boolean; last_seen: number });
            } else {
                callback(null);
            }
        },
        (error) => {
            console.error(`Error listening to status for user ${userId}:`, error);
            callback(null);
        }
    );
};
