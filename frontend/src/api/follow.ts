// frontend/src/api/follow.ts

export type UserItem = {
    username: string;
    avatar: string | null;
};

export type UserSlice = {
    items: UserItem[];
    hasNext: boolean;
    nextCursor: number | null;
};

async function safeJson(r: Response) {
    const t = await r.text();
    if (!t) return null;
    try { return JSON.parse(t); } catch { return null; }
}

function normalizeSlice(json: any): UserSlice {
    // Підтримуємо і {items: [...]}, і {content: [...]}
    const raw = Array.isArray(json?.items) ? json.items
        : Array.isArray(json?.content) ? json.content
            : [];
    const items: UserItem[] = raw
        .map((u: any) => ({
            username: String(u?.username ?? ""),
            avatar: u?.avatar ?? null,
        }))
        .filter((u: UserItem) => !!u.username);

    const hasNext = Boolean(json?.hasNext);
    const nextCursor =
        typeof json?.nextCursor === "number" || json?.nextCursor === null
            ? json?.nextCursor
            : null;

    return { items, hasNext, nextCursor };
}

// ==== Base URL + helpers ====
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
const url = (path: string) => (BASE ? `${BASE}${path}` : path);

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    return fetch(url(path), {
        ...init,
        headers,
        credentials: "include",
    });
}

// ===== API =====
export async function fetchFollowers(
    username: string,
    cursor?: number,
    size = 20,
    q = ""
): Promise<UserSlice> {
    const u = new URL(url(`/api/users/${encodeURIComponent(username)}/followers`));
    if (cursor != null) u.searchParams.set("cursor", String(cursor));
    u.searchParams.set("size", String(size));
    if (q) u.searchParams.set("q", q);

    const r = await apiFetch(u.pathname + (u.search || ""));
    if (!r.ok) throw new Error(`Followers load failed: ${r.status}`);
    return normalizeSlice(await safeJson(r));
}

export async function fetchFollowing(
    username: string,
    cursor?: number,
    size = 20,
    q = ""
): Promise<UserSlice> {
    const u = new URL(url(`/api/users/${encodeURIComponent(username)}/following`));
    if (cursor != null) u.searchParams.set("cursor", String(cursor));
    u.searchParams.set("size", String(size));
    if (q) u.searchParams.set("q", q);

    const r = await apiFetch(u.pathname + (u.search || ""));
    if (!r.ok) throw new Error(`Following load failed: ${r.status}`);
    return normalizeSlice(await safeJson(r));
}
