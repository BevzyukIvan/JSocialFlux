// src/utils/avatar.ts
export const DEF_USER_AVATAR  = '/images/default-avatar.png';
export const DEF_GROUP_AVATAR = '/images/default-group.png';

export function pickChatAvatar(isGroup: boolean, displayAvatar?: string | null) {
    return displayAvatar || (isGroup ? DEF_GROUP_AVATAR : DEF_USER_AVATAR);
}

export function getAvatar(src?: string | null): string {
    return src && src.trim().length > 0 ? src : DEF_USER_AVATAR;
}
