import { FormattedUser, ChatData, UserData, FormattedChat } from './types';

export const formatUserData = (userData: UserData[]): FormattedUser[] => {
    const formattedData = [];

    for (const userId in userData) {
        if (userData.hasOwnProperty(userId)) {
            const user = userData[userId];
            formattedData.push({
                id: userId,
                email: user.email,
                username: user.username,
            });
        }
    }

    return formattedData;
};

// export const formatChatData = (chatData: ChatData[]): FormattedChat[] => {
//     const formattedData = [];

//     for (const id in chatData) {
//         if (chatData.hasOwnProperty(id)) {
//             const id = chatData[id];
//             formattedData.push({
//                 id: id,
//                 participants:
//             });
//         }
//     }

//     return formattedData;
// };
