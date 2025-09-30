export type ChatViewDTO = {
    chatId: number;
    displayName: string;
    displayAvatar: string | null;
    isGroup: boolean;
    lastMessage: string | null;
    lastSentAt: string | null;
};

export type ChatSlice = {
    items: ChatViewDTO[];
    hasNext: boolean;
    nextCursorEpochMs: number | null;
    nextCursorId: number | null;
};

export type ChatOpenDTO = {
    chatId: number;
    counterpartUsername: string | null;
    counterpartAvatar: string | null;
};

export type StartPrivateChatRequest = { username: string };
export type CreateGroupChatRequest = { name: string; usernames: string[] };

function toUrl(path: string, params?: Record<string, string | number | undefined>) {
    const u = new URL(path, window.location.origin);
    if (params) for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, String(v));
    return u.toString();
}

export async function fetchMyChats(cursorEpochMs?: number, cursorId?: number, size = 20): Promise<ChatSlice> {
    const r = await fetch(toUrl('/api/chats', { cursorEpochMs, cursorId, size }), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
    });
    if (!r.ok) throw new Error(`Failed to load chats: ${r.status}`);
    return r.json();
}

export async function startPrivateChat(username: string): Promise<ChatOpenDTO> {
    const r = await fetch('/api/chats/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username } as StartPrivateChatRequest),
    });
    if (!r.ok) throw new Error(`Failed to open private chat: ${r.status}`);
    return r.json();
}

export async function createGroupChat(req: CreateGroupChatRequest): Promise<ChatOpenDTO> {
    const r = await fetch('/api/chats/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error(`Failed to create group chat: ${r.status}`);
    return r.json();
}
