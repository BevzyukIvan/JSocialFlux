// frontend/src/api/search.ts

const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
const url = (path: string) => (BASE ? `${BASE}${path}` : path);

export type UserCardDTO = {
    username: string;
    avatar?: string | null;
};

export type UserSlice = {
    content: UserCardDTO[];
    hasNext: boolean;
    nextCursor: number | null;
};

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    headers.set("X-Requested-With", "XMLHttpRequest");
    return fetch(url(path), {
        ...init,
        headers,
        credentials: "include",
    });
}

export async function searchUsers(
    q: string,
    cursor?: number,
    size = 20
): Promise<UserSlice> {
    const params = new URLSearchParams();
    params.set("q", q);
    if (cursor != null) params.set("cursor", String(cursor));
    params.set("size", String(size));

    const res = await apiFetch(`/api/search?${params.toString()}`);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return res.json() as Promise<UserSlice>;
}
