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
  query,
  orderByChild,
  set,
} from 'firebase/database';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import React from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { auth } from './firebase-config';

import {
  ChatData,
  ChatPartner,
  FirebaseMessage,
  FormattedUser,
  ReplyMessageInfo,
  UserData,
} from '~/lib/types';

export interface FirebaseUserResponse {
  user: User;
}

export async function login(
  email: string,
  password: string
): Promise<FirebaseUserResponse | undefined> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: 'Login failed',
      text2: 'Invalid email or password',
    });
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
        const chatPromises = chatIds.map(async (chatId) => {
          try {
            const chatRef = ref(db, `chats/${chatId}`);
            const chatSnapshot = await get(chatRef);
            if (chatSnapshot.exists()) {
              const chatData = chatSnapshot.val();
              const participants = chatData.participants || {};
              const participantKeys = Object.keys(participants);
              const partnerKey = participantKeys.find(
                (key) => !key.includes(userId) && key.includes('_')
              );
              let partnerName = 'Anonymous';
              let partnerId = '';
              if (partnerKey) {
                if (partnerKey.includes('_')) {
                  const parts = partnerKey.split('_');
                  partnerName = parts[1];
                  partnerId = parts[0];
                }
              }
              return {
                id: chatId,
                lastMessage: chatData.lastMessage,
                partner: partnerName,
                partnerId,
                updatedAt: chatData.updatedAt,
              };
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

export const createChat = async (
  currentUserId: string,
  currentUserName: string,
  otherUserId: string,
  otherUserName: string
): Promise<string> => {
  const userIds = [currentUserId, otherUserId].sort();
  const chatId = userIds.join('_');
  const chatRef = ref(db, `chats/${chatId}`);

  const existingChat = await get(chatRef);
  if (existingChat.exists()) {
    Alert.alert('Chat already exists, returning existing chat ID:');
    return chatId;
  }

  const participantsData = {
    [`${currentUserId}_${currentUserName}`]: true,
    [`${otherUserId}_${otherUserName}`]: true,
  };

  const newChatData = {
    participants: participantsData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
  };

  const updates: { [key: string]: any } = {};
  updates[`/chats/${chatId}`] = newChatData;
  updates[`/users/${currentUserId}/chats/${chatId}`] = true;
  updates[`/users/${otherUserId}/chats/${chatId}`] = true;

  try {
    await update(ref(db), updates);
    return chatId;
  } catch (error: any) {
    console.error('Error creating chat in service:', error);
    throw new Error(error.message || 'Failed to create chat.');
  }
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

export const updateUserPresence = (userId: string, chatId: string, isActive: boolean) => {
  const userStatusRef = ref(db, `userStatus/${userId}`);
  const userChatStatusRef = ref(db, `chats/${chatId}/participants/${userId}`);
  const status = {
    isActive,
    lastActive: serverTimestamp(),
  };
  update(userStatusRef, status);
  update(userChatStatusRef, status);
};

export const setupPresenceDisconnectHandlers = (userId: string, chatId: string) => {
  const userStatusRef = ref(db, `userStatus/${userId}`);
  const userChatStatusRef = ref(db, `chats/${chatId}/participants/${userId}`);
  onDisconnect(userStatusRef).update({
    isActive: false,
    lastActive: serverTimestamp(),
  });
  onDisconnect(userChatStatusRef).update({
    isActive: false,
    lastActive: serverTimestamp(),
  });
};

export const setTypingStatus = (userId: string, chatId: string, isTyping: boolean) => {
  const typingRef = ref(db, `chats/${chatId}/participants/${userId}/isTyping`);
  update(typingRef, { isTyping });
};

export const markMessagesAsRead = (
  chatId: string,
  currentUserId: string,
  messages: FirebaseMessage[]
) => {
  const unreadMessages = messages.filter((msg) => msg.senderId !== currentUserId && !msg.read);
  if (unreadMessages.length) {
    const updates: Record<string, boolean> = {};
    unreadMessages.forEach((msg) => {
      updates[`chats/${chatId}/messages/${msg.id}/read`] = true;
    });
    update(ref(db), updates);
  }
};

export const fetchChatPartnerInfo = async (
  chatId: string,
  currentUserId: string
): Promise<ChatPartner> => {
  const chatMetaRef = ref(db, `chats/${chatId}`);

  try {
    const snapshot = await get(chatMetaRef);
    if (!snapshot.exists()) {
      throw new Error('Chat metadata not found.');
    }

    const chatData = snapshot.val();
    const participantIds = Object.keys(chatData.participants || {});
    const partnerIdWithName = participantIds.find((pId) => !pId.includes(currentUserId));

    let partnerId: string | undefined;
    if (partnerIdWithName?.includes('_')) {
      partnerId = partnerIdWithName?.split('_')[0];
    } else {
      partnerId = partnerIdWithName;
    }

    if (!partnerId) {
      throw new Error('Chat partner not found in participants.');
    }

    const userRef = ref(db, `users/${partnerId}`);
    const userSnapshot = await get(userRef);
    if (!userSnapshot || !userSnapshot.exists()) {
      throw new Error('Chat partner user data not found.');
    }
    const userData = userSnapshot.val();

    const statusRef = ref(db, `chats/${chatId}/participants/${partnerId}`);
    const statusSnapshot = await get(statusRef);
    const statusData = statusSnapshot.val() || {};

    const chatPartnerInfo: ChatPartner = {
      id: partnerId,
      username: userData.username,
      isActive: statusData.isActive || false,
      isTyping: statusData.isTyping || false,
      lastActive: statusData.lastActive || null,
      isLoggedIn: userData.isLoggedIn || false,
    };

    return chatPartnerInfo;
  } catch (error: any) {
    console.error('Error fetching chat partner info:', error);
    throw error;
  }
};

export const listenForMessages = (
  chatId: string,
  currentUserId: string,
  setMessages: React.Dispatch<React.SetStateAction<FirebaseMessage[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  sendNotification: (message: FirebaseMessage) => void
) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  const messagesQuery = query(messagesRef, orderByChild('timestamp'));
  setLoading(true);
  setError(null);
  let initialLoad = true;

  const unsubscribe = onValue(
    messagesQuery,
    (snapshot) => {
      const messagesData = snapshot.val();
      if (messagesData) {
        const messagesList: FirebaseMessage[] = Object.entries(messagesData).map(
          ([key, value]: [string, any]) => ({
            id: key,
            content: value.content,
            imageUrl: value.imageUrl || null,
            senderId: value.senderId,
            timestamp: value.timestamp,
            read: value.read || false,
            reaction: value.reactions || undefined,
            replyMessage: value.replyMessage || null,
          })
        );
        setMessages(messagesList);

        if (!initialLoad && messagesList.length > 0) {
          const latestMessage = messagesList[messagesList.length - 1];
          if (latestMessage.senderId !== currentUserId) {
            sendNotification(latestMessage);
          }
        }
      } else {
        setMessages([]);
      }
      setLoading(false);
      initialLoad = false;
    },
    (err: any) => {
      console.error('Error listening to messages:', err);
      setError(err.message || 'Failed to load messages.');
      setLoading(false);
    }
  );
  return unsubscribe;
};

export const sendMessage = async (
  chatId: string,
  userId: string,
  content: string,
  replyMessage: ReplyMessageInfo | null = null
) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  const chatMetaRef = ref(db, `chats/${chatId}`);
  const newMessageData = {
    content: content.trim(),
    senderId: userId,
    timestamp: serverTimestamp(),
    read: false,
    replyMessage: replyMessage ?? null,
  };
  try {
    await push(messagesRef, newMessageData);
    const lastMessageUpdate = {
      lastMessage: {
        content: content.trim(),
        timestamp: serverTimestamp(),
        senderId: userId,
        read: false,
      },
      updatedAt: serverTimestamp(),
    };
    await update(chatMetaRef, lastMessageUpdate);
  } catch (err: any) {
    console.error('Error sending message:', err);
    throw new Error('Failed to send message.');
  }
};

export const sendImageMessage = async (
  chatId: string,
  senderId: string,
  imageUri: string,
  text: string = '',
  replyTo: ReplyMessageInfo | null = null
) => {
  try {
    // Get the storage instance and create a reference
    const storage = getStorage();
    const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
    const storageReference = storageRef(storage, `chat_images/${chatId}/${Date.now()}_${filename}`);

    // Convert image to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    // const blob = await new Promise<Blob>((resolve, reject) => {
    //   const xhr = new XMLHttpRequest();
    //   xhr.onload = () => {
    //     resolve(xhr.response);
    //   };
    //   xhr.onerror = (e) => {
    //     console.error('Network request failed:', e);
    //     reject(new Error('Network request failed'));
    //   };
    //   xhr.responseType = 'blob';
    //   xhr.open('GET', imageUri, true);
    //   xhr.send(null);
    // });

    // Upload to Firebase storage
    const uploadTask = uploadBytesResumable(storageReference, blob);

    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // You can track progress here if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          // Handle unsuccessful uploads
          reject(error);
        },
        () => {
          // Upload completed successfully
          resolve(null);
        }
      );
    });

    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    await push(messagesRef, {
      content: text,
      imageUrl: downloadURL,
      senderId,
      timestamp: serverTimestamp(),
      read: {},
      replyTo: replyTo
        ? {
            id: replyTo.id,
            content: replyTo.content,
            senderId: replyTo.senderId,
          }
        : null,
    });

    const chatMetaRef = ref(db, `chats/${chatId}`);
    await push(chatMetaRef, {
      lastMessage: {
        content: text ? text : imageUri,
        senderId,
        timestamp: serverTimestamp(),
        hasImage: true,
      },
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const resetTypingStatus = (userId: string, chatId: string) => {
  const typingRef = ref(db, `chats/${chatId}/participants/${userId}/isTyping`);
  update(typingRef, { isTyping: false });
};

export const reactToMessage = async (
  messageId: string,
  emoji: string,
  chatId: string
  // currentUserId: string .... if i want to do a group chat, this will be important
) => {
  const reactionRef = ref(db, `chats/${chatId}/messages/${messageId}/reactions`);
  await set(reactionRef, emoji);
};
