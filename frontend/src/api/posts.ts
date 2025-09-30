// frontend/src/api/posts.ts

export type PostCardDTO = {
    id: number;
    content: string;
    createdAt: string; // ISO
    edited: boolean;
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

/** Створити текстовий пост */
export async function createPost(content: string): Promise<PostCardDTO> {
    const res = await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Create post failed (${res.status})`);
    return res.json() as Promise<PostCardDTO>;
}
