// frontend/src/api/userSearch.ts (або заміни свій файл)

export type UserCardDTO = {
    id: number;
    username: string;
    avatar: string | null;
};

export type UserSlice = {
    content: UserCardDTO[];
    hasNext: boolean;
    nextCursor: number | null;
};

// ==== Base URL + helpers ====
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

function url(path: string, params?: Record<string, string | number | undefined>): string {
    const baseForURL = BASE || window.location.origin; // локально працює через Vite proxy
    const u = new URL(path, baseForURL);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v != null) u.searchParams.set(k, String(v));
        }
    }
    return u.toString();
}

async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    headers.set("X-Requested-With", "XMLHttpRequest");
    return fetch(input, {
        ...init,
        headers,
        credentials: "include",
        cache: "no-store",
    });
}

// Рекомендації (ваша мережа: підписані ви / на вас)
export async function fetchUserSuggestions(
    q?: string,
    cursor?: number,
    size = 20
): Promise<UserSlice> {
    const r = await apiFetch(
        url("/api/users/suggestions", { q, cursor, size, _t: Date.now() })
    );
    if (!r.ok) throw new Error(`Failed to load suggestions: ${r.status}`);
    return r.json();
}

// Загальний пошук по всіх користувачах
export async function searchUsersAll(
    q: string,
    cursor?: number,
    size = 20
): Promise<UserSlice> {
    const r = await apiFetch(
        url("/api/users/search", { q, cursor, size, _t: Date.now() })
    );
    if (!r.ok) throw new Error(`Failed to search users: ${r.status}`);
    return r.json();
}
