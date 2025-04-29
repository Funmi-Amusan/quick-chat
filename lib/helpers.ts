import { days, shortDays } from "./data";

export const formatTimestamp = (timestamp: number) => {
  const date = new Date(+timestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${hours}:${formattedMinutes}${ampm}`;
};

export const formatTimestampToDay = (timestamp: number) => {
  const date = new Date(+timestamp);
  const now = new Date();
  const diffTime = Math.floor(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

 // Today
  if (diffDays === 0) {
    return 'Today';
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // This week (within 7 days)
  if (diffDays < 7) {
    return `${days[date.getDay()]}`;
  }

  // Default: show full date
  const month = date.toLocaleString('default', { month: 'short' });
  const day = shortDays[date.getDay()];
  const dayOfMonth = date.getDate();
  const year = now.getFullYear() !== date.getFullYear() ? `, ${date.getFullYear()}` : '';

  return `${day}, ${month} ${dayOfMonth}${year}`;
};

export const formatMomentAgo = (timestamp: number | null) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  // console.log("diffMinutes", diffMinutes)
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
};

export const formatTimestampToTimeOrDate = (timestamp: number) => {
  const date = new Date(+timestamp);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeString = `${hours}:${formattedMinutes}${ampm}`;

  // Today
  if (diffDays === 0) {
    return timeString;
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // Default: show full date
  const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;

  return formattedDate;
};

export const isSameDay = (timestamp1: number, timestamp2: number | null) => {
  if (!timestamp1 || !timestamp2) return false;
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const getFileExtension = (fileName: string | undefined | null): string => {
  if (!fileName) {
    return 'unknown';
  }
  const parts = fileName.split('.');
  if (parts.length > 1) {
   return parts.pop()!.toLowerCase();
  }
  return 'unknown'; 
};