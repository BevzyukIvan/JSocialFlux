// frontend/src/api/posts.ts
export type PostCardDTO = {
    id: number;
    content: string;
    createdAt: string;  // ISO
    edited: boolean;
};

const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

/** Створити текстовий пост */
export async function createPost(content: string): Promise<PostCardDTO> {
    const res = await fetch(`${BASE}/api/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Create post failed (${res.status})`);
    return (await res.json()) as PostCardDTO;
}
