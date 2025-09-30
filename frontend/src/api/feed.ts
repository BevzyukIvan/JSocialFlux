// API для фіда з композитним курсором

export type FeedType = "POST" | "PHOTO";

export type FeedItemDTO = {
    id: number;
    type: FeedType;
    username: string;
    avatar?: string | null;
    content?: string | null;
    imageUrl?: string | null;
    createdAt: string;   // або ISO-рядок/epoch. Головне: бек повертає одне й те саме поле.
    edited?: boolean;
};

export type FeedCursor =
    | { ts: number; type: FeedType; id: number }
    | null;

export type FeedSlice = {
    content: FeedItemDTO[];
    hasNext: boolean;
    nextCursor: FeedCursor;
};

const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

// Отримати фід (з курсором або з першої сторінки)
export async function fetchFeed(cursor?: FeedCursor, size = 10): Promise<FeedSlice> {
    const params = new URLSearchParams();
    params.set("size", String(size));
    if (cursor && cursor.ts && cursor.type && cursor.id != null) {
        params.set("cursorTs", String(cursor.ts));
        params.set("cursorType", cursor.type);
        params.set("cursorId", String(cursor.id));
    }

    const res = await fetch(`${BASE}/api/feed?${params.toString()}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    // очікуємо формат: { content, hasNext, nextCursor: { ts, type, id } | null }
    return (await res.json()) as FeedSlice;
}

// Видалення елемента з фіда
export async function deleteItem(type: FeedType, id: number): Promise<boolean> {
    const plural = type === "POST" ? "posts" : "photos";
    const res = await fetch(`${BASE}/api/${plural}/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    return res.ok;
}
