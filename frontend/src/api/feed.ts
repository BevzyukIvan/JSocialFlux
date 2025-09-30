// src/api/feed.ts
// API для фіда з композитним курсором

export type FeedType = "POST" | "PHOTO";

export type FeedItemDTO = {
    id: number;
    type: FeedType;
    username: string;
    avatar?: string | null;
    content?: string | null;
    imageUrl?: string | null;
    createdAt: string; // ISO/epoch — бек повертає стабільне поле
    edited?: boolean;
};

export type FeedCursor = { ts: number; type: FeedType; id: number } | null;

export type FeedSlice = {
    content: FeedItemDTO[];
    hasNext: boolean;
    nextCursor: FeedCursor;
};

// ==== Base URL + helpers ====
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
const url = (path: string) => (BASE ? `${BASE}${path}` : path);

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    if (!headers.has("Content-Type") && init.method && init.method !== "GET") {
        headers.set("Content-Type", "application/json");
    }
    return fetch(url(path), {
        ...init,
        headers,
        credentials: "include",
    });
}

// ===== Отримати фід (з курсором або з першої сторінки) =====
export async function fetchFeed(cursor?: FeedCursor, size = 10): Promise<FeedSlice> {
    const params = new URLSearchParams();
    params.set("size", String(size));
    if (cursor && cursor.ts != null && cursor.type && cursor.id != null) {
        params.set("cursorTs", String(cursor.ts));
        params.set("cursorType", cursor.type);
        params.set("cursorId", String(cursor.id));
    }

    const res = await apiFetch(`/api/feed?${params.toString()}`);
    if (!res.ok) throw new Error(`feed ${res.status}`);
    return (await res.json()) as FeedSlice;
}

// ===== Видалення елемента з фіда =====
export async function deleteItem(type: FeedType, id: number): Promise<boolean> {
    const plural = type === "POST" ? "posts" : "photos";
    const res = await apiFetch(`/api/${plural}/${id}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    return res.ok;
}
