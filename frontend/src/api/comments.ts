// frontend/src/api/comments.ts

export type Cursor2 = { ts: number; id: number } | null;

export type PostCommentDTO = {
    id: number;
    content: string;
    createdAt: string; // ISO
    authorUsername: string | null;
    authorAvatar: string | null;
};

export type PhotoCommentDTO = PostCommentDTO;

export type Slice<T> = {
    items: T[];
    hasNext: boolean;
    nextCursor: Cursor2; // {ts,id} або null
};

// ==== Base URL + fetch утиліта ====
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

// ==== helpers ====
function qs(cursor?: Cursor2, size?: number) {
    const p = new URLSearchParams();
    if (cursor && cursor.ts != null) p.set("cursorTs", String(cursor.ts));
    if (cursor && cursor.id != null) p.set("cursorId", String(cursor.id));
    if (size) p.set("size", String(size));
    return p.toString();
}

// ===== POSTS =====
export async function fetchPostComments(
    postId: number,
    cursor?: Cursor2,
    size = 10
): Promise<Slice<PostCommentDTO>> {
    const q = qs(cursor ?? undefined, size);
    const res = await apiFetch(`/api/posts/${postId}/comments${q ? `?${q}` : ""}`);
    if (!res.ok) throw new Error(`Failed to load post comments: ${res.status}`);
    return res.json();
}

export async function createPostComment(
    postId: number,
    content: string
): Promise<PostCommentDTO> {
    const res = await apiFetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Failed to create comment: ${res.status}`);
    return res.json();
}

export async function deletePostComment(
    postId: number,
    commentId: number
): Promise<boolean> {
    const res = await apiFetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
    });
    if (res.status === 204) return true;
    if (res.status === 403) return false;
    throw new Error(`Delete failed: ${res.status}`);
}

// ===== PHOTOS =====
export async function fetchPhotoComments(
    photoId: number,
    cursor?: Cursor2,
    size = 10
): Promise<Slice<PhotoCommentDTO>> {
    const q = qs(cursor ?? undefined, size);
    const res = await apiFetch(`/api/photos/${photoId}/comments${q ? `?${q}` : ""}`);
    if (!res.ok) throw new Error(`Failed to load photo comments: ${res.status}`);
    return res.json();
}

export async function createPhotoComment(
    photoId: number,
    content: string
): Promise<PhotoCommentDTO> {
    const res = await apiFetch(`/api/photos/${photoId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Failed to create comment: ${res.status}`);
    return res.json();
}

export async function deletePhotoComment(
    photoId: number,
    commentId: number
): Promise<boolean> {
    const res = await apiFetch(`/api/photos/${photoId}/comments/${commentId}`, {
        method: "DELETE",
    });
    if (res.status === 204) return true;
    if (res.status === 403) return false;
    throw new Error(`Delete failed: ${res.status}`);
}
