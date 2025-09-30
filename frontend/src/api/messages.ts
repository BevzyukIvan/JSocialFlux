// frontend/src/api/messages.ts

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

// ==== Base URL + helpers ====
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
    const baseForURL = BASE || window.location.origin; // локально — Vite proxy
    const u = new URL(path, baseForURL);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v != null) u.searchParams.set(k, String(v));
        }
    }
    return u.toString();
};

async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    // заголовки проти кешу
    headers.set("X-Requested-With", "XMLHttpRequest");
    headers.set("Cache-Control", "no-cache");
    headers.set("Pragma", "no-cache");

    return fetch(input, {
        ...init,
        headers,
        credentials: "include",
        cache: "no-store",
    });
}

// ===== API =====
export async function fetchMessages(
    chatId: number,
    cursorEpochMs?: number,
    cursorId?: number,
    size = 30
): Promise<MessageSlice> {
    const url = buildUrl(`/api/chats/${chatId}/messages`, {
        cursorEpochMs,
        cursorId,
        size,
        _t: Date.now(), // cache-buster
    });

    const r = await apiFetch(url);
    if (!r.ok) throw new Error(`Failed to load messages: ${r.status}`);
    return r.json();
}

export async function sendMessage(chatId: number, content: string): Promise<MessageDTO> {
    const r = await apiFetch(buildUrl(`/api/chats/${chatId}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content }),
    });
    if (!r.ok) throw new Error(`Failed to send: ${r.status}`);
    return r.json();
}

export async function deleteMessage(chatId: number, messageId: number): Promise<void> {
    const r = await apiFetch(buildUrl(`/api/chats/${chatId}/messages/${messageId}`), {
        method: "DELETE",
    });
    if (!r.ok) throw new Error(`Failed to delete: ${r.status}`);
}
