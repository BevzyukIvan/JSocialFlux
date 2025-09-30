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

function toUrl(path: string, params?: Record<string, string | number | undefined>) {
    const u = new URL(path, window.location.origin);
    if (params) for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, String(v));
    return u.toString();
}

// Рекомендації (ваша мережа: підписані ви / на вас)
export async function fetchUserSuggestions(q?: string, cursor?: number, size = 20): Promise<UserSlice> {
    const r = await fetch(
        toUrl('/api/users/suggestions', { q, cursor, size, _t: Date.now() }),
        { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'include', cache: 'no-store' }
    );
    if (!r.ok) throw new Error(`Failed to load suggestions: ${r.status}`);
    return r.json();
}

// Загальний пошук по всіх користувачах
export async function searchUsersAll(q: string, cursor?: number, size = 20): Promise<UserSlice> {
    const r = await fetch(
        toUrl('/api/users/search', { q, cursor, size, _t: Date.now() }),
        { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'include', cache: 'no-store' }
    );
    if (!r.ok) throw new Error(`Failed to search users: ${r.status}`);
    return r.json();
}
