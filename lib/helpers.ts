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

export const formatTimestamp = (timestamp: string) => {
    const date = new Date(+timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${hours}:${formattedMinutes}${ampm}`;
};

export const formatMomentAgo = (timestamp: number | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
};
