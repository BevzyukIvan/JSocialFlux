// src/api/chats.ts

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

// ==== Base URL + helpers ====
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

function url(path: string, params?: Record<string, string | number | undefined>): string {
    const baseForURL = BASE || window.location.origin; // локально працює через Vite proxy
    const u = new URL(path, baseForURL);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v != null) u.searchParams.set(k, String(v));
        }
    }
    return u.toString();
}

async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    if (!headers.has("Content-Type") && init.method && init.method !== "GET") {
        headers.set("Content-Type", "application/json");
    }
    return fetch(input, {
        ...init,
        headers,
        credentials: "include",
    });
}

// ==== API ====
export async function fetchMyChats(
    cursorEpochMs?: number,
    cursorId?: number,
    size = 20
): Promise<ChatSlice> {
    const r = await apiFetch(url("/api/chats", { cursorEpochMs, cursorId, size }), {
        headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (!r.ok) throw new Error(`Failed to load chats: ${r.status}`);
    return r.json();
}

export async function startPrivateChat(username: string): Promise<ChatOpenDTO> {
    const r = await apiFetch(url("/api/chats/private"), {
        method: "POST",
        body: JSON.stringify({ username } as StartPrivateChatRequest),
    });
    if (!r.ok) throw new Error(`Failed to open private chat: ${r.status}`);
    return r.json();
}

export async function createGroupChat(req: CreateGroupChatRequest): Promise<ChatOpenDTO> {
    const r = await apiFetch(url("/api/chats/group"), {
        method: "POST",
        body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error(`Failed to create group chat: ${r.status}`);
    return r.json();
}
