const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

export type UserCardDTO = {
    username: string;
    avatar?: string | null;
};

export type UserSlice = {
    content: UserCardDTO[];
    hasNext: boolean;
    nextCursor: number | null;
};

export async function searchUsers(
    q: string,
    cursor?: number,
    size = 20
): Promise<UserSlice> {
    const params = new URLSearchParams();
    params.set("q", q);
    if (cursor != null) params.set("cursor", String(cursor));
    params.set("size", String(size));

    const res = await fetch(`${BASE}/api/search?${params.toString()}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return (await res.json()) as UserSlice;
}
