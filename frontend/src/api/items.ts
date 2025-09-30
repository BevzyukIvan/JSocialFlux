const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

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
    const r = await fetch(`${BASE}/api/photos/${id}`, { credentials: "include" });
    if (!r.ok) throw new Error("Фото не знайдено");
    return r.json();
}

export async function fetchPost(id: number): Promise<PostResponseDTO> {
    const r = await fetch(`${BASE}/api/posts/${id}`, { credentials: "include" });
    if (!r.ok) throw new Error("Пост не знайдено");
    return r.json();
}

export async function updatePhotoDescription(id: number, description: string) {
    const res = await fetch(`/api/photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description }),
    });
    if (!res.ok) throw new Error(`Помилка ${res.status}`);
    return (await res.json()) as PhotoResponseDTO;
}

export async function updatePostContent(id: number, content: string) {
    const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Помилка ${res.status}`);
    return (await res.json()) as PostResponseDTO;
}
