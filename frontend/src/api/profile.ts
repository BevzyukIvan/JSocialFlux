// frontend/src/api/profile.ts

export type Role = "ROLE_USER" | "ROLE_ADMIN" | string;

export type Cursor2 = { ts: number; id: number } | null;

export type UserProfileDTO = {
    username: string;
    avatar: string | null;
    followersCnt: number;
    followingCnt: number;
    me: boolean;
    following: boolean;
    follower: boolean;
};

export type PostCardDTO = {
    id: number;
    content: string;
    createdAt: string; // ISO від бекенду; в UI перетворимо на Date
    edited: boolean;
};

export type PhotoCardDTO = {
    id: number;
    url: string;
    uploadedAt: string; // ISO
    description: string | null;
};

export type Slice<T> = {
    content: T[];
    hasNext: boolean;
    nextCursor: { ts: number; id: number } | null;
};

// ==== Base URL + helpers ====
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
const url = (path: string) => (BASE ? `${BASE}${path}` : path);

function q(params: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) sp.set(k, String(v));
    });
    const s = sp.toString();
    return s ? `?${s}` : "";
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    return fetch(url(path), {
        ...init,
        headers,
        credentials: "include",
    });
}

// ==== API ====
export async function fetchProfile(username: string): Promise<UserProfileDTO> {
    const res = await apiFetch(`/api/users/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error(`Profile load failed: ${res.status}`);
    return res.json();
}

export async function fetchUserPosts(
    username: string,
    cursor: Cursor2 | undefined,
    size = 9
): Promise<Slice<PostCardDTO>> {
    const res = await apiFetch(
        `/api/users/${encodeURIComponent(username)}/posts${q({
            cursorTs: cursor?.ts,
            cursorId: cursor?.id,
            size,
        })}`
    );
    if (!res.ok) throw new Error(`Posts load failed: ${res.status}`);
    return res.json();
}

export async function fetchUserPhotos(
    username: string,
    cursor: Cursor2 | undefined,
    size = 9
): Promise<Slice<PhotoCardDTO>> {
    const res = await apiFetch(
        `/api/users/${encodeURIComponent(username)}/photos${q({
            cursorTs: cursor?.ts,
            cursorId: cursor?.id,
            size,
        })}`
    );
    if (!res.ok) throw new Error(`Photos load failed: ${res.status}`);
    return res.json();
}

// універсальний DELETE (як у фіді)
export async function deleteProfileItem(
    type: "post" | "photo",
    id: number
): Promise<boolean> {
    const res = await apiFetch(`/api/${type}s/${id}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    return res.ok;
}

export async function followUser(username: string): Promise<void> {
    const res = await apiFetch(`/api/users/${encodeURIComponent(username)}/follow`, {
        method: "POST",
    });
    if (!res.ok) throw new Error(`Follow failed: ${res.status}`);
}

export async function unfollowUser(username: string): Promise<void> {
    const res = await apiFetch(`/api/users/${encodeURIComponent(username)}/follow`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error(`Unfollow failed: ${res.status}`);
}
