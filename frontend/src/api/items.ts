// frontend/src/api/itemDetails.ts

const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
const url = (path: string) => (BASE ? `${BASE}${path}` : path);

async function apiFetch(path: string, init: RequestInit = {}) {
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

export type PhotoResponseDTO = {
    id: number;
    url: string;
    uploadedAt: string;
    description?: string | null;
    ownerUsername: string;
    ownerAvatar?: string | null;
};

export type PostResponseDTO = {
    id: number;
    content: string;
    createdAt: string;
    edited: boolean;
    ownerUsername: string;
    ownerAvatar?: string | null;
};

export async function fetchPhoto(id: number): Promise<PhotoResponseDTO> {
    const r = await apiFetch(`/api/photos/${id}`);
    if (!r.ok) throw new Error("Фото не знайдено");
    return r.json();
}

export async function fetchPost(id: number): Promise<PostResponseDTO> {
    const r = await apiFetch(`/api/posts/${id}`);
    if (!r.ok) throw new Error("Пост не знайдено");
    return r.json();
}

export async function updatePhotoDescription(
    id: number,
    description: string
): Promise<PhotoResponseDTO> {
    const r = await apiFetch(`/api/photos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ description }),
    });
    if (!r.ok) throw new Error(`Помилка ${r.status}`);
    return r.json();
}

export async function updatePostContent(
    id: number,
    content: string
): Promise<PostResponseDTO> {
    const r = await apiFetch(`/api/posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
    });
    if (!r.ok) throw new Error(`Помилка ${r.status}`);
    return r.json();
}
