export type MessageDTO = {
    id: number;
    chatId: number;
    content: string;
    sentAt: string; // ISO
    senderUsername: string;
    senderAvatar: string | null;
};

export type MessageSlice = {
    items: MessageDTO[];
    hasNext: boolean;
    nextCursorEpochMs: number | null;
    nextCursorId: number | null;
};

function toUrl(path: string, params?: Record<string, string | number | undefined>) {
    const u = new URL(path, window.location.origin);
    if (params) for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, String(v));
    return u.toString();
}

// api/messages.ts
export async function fetchMessages(chatId: number, cursorEpochMs?: number, cursorId?: number, size = 30): Promise<MessageSlice> {
    const url = toUrl(`/api/chats/${chatId}/messages`, {
        cursorEpochMs, cursorId, size, _t: Date.now(),   // 👈 cache-buster
    });

    const r = await fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        },
        credentials: 'include',
        cache: 'no-store',                                 // 👈 забороняємо кеш браузера
    });
    if (!r.ok) throw new Error(`Failed to load messages: ${r.status}`);
    return r.json();
}


export async function sendMessage(chatId: number, content: string): Promise<MessageDTO> {
    const r = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chatId, content }),
    });
    if (!r.ok) throw new Error(`Failed to send: ${r.status}`);
    return r.json();
}

export async function deleteMessage(chatId: number, messageId: number): Promise<void> {
    const r = await fetch(`/api/chats/${chatId}/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!r.ok) throw new Error(`Failed to delete: ${r.status}`);
}
