// frontend/src/api/updateProfile.ts
// API для оновлення профілю (PUT /api/users/{username})

const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
const url = (path: string) => (BASE ? `${BASE}${path}` : path);

export type UpdateProfileCmd = {
    newUsername: string;
    deleteAvatar: boolean;
};

export type ProfileUpdateResponse = {
    username: string;
    avatar: string | null; // бек повертає актуальний URL або null
};

export async function updateProfile(
    username: string,
    cmd: UpdateProfileCmd,
    file?: File
): Promise<ProfileUpdateResponse> {
    const fd = new FormData();
    fd.append("payload", new Blob([JSON.stringify(cmd)], { type: "application/json" }));
    if (file) fd.append("avatar", file);

    const res = await fetch(url(`/api/users/${encodeURIComponent(username)}`), {
        method: "PUT",
        body: fd,
        credentials: "include", // не ставимо Content-Type вручну
    });

    if (!res.ok) throw new Error(`Update failed: ${res.status}`);

    // Очікуємо 200 + JSON { username, avatar }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        const data = (await res.json()) as ProfileUpdateResponse;
        return {
            username: data?.username ?? cmd.newUsername?.trim() ?? username,
            avatar: data?.avatar ?? null,
        };
    }

    // Фолбек (якщо раптом 204): повертаємо нове ім'я і avatar:null
    return {
        username: cmd.newUsername?.trim() || username,
        avatar: null,
    };
}
