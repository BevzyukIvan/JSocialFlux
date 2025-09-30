// API для оновлення профілю (PUT /api/users/{username})
export type UpdateProfileCmd = {
    newUsername: string;
    deleteAvatar: boolean;
};

type UsernameDto = { username: string };

export async function updateProfile(
    username: string,
    cmd: UpdateProfileCmd,
    file?: File
): Promise<string> {
    const fd = new FormData();
    fd.append("payload", new Blob([JSON.stringify(cmd)], { type: "application/json" }));
    if (file) fd.append("avatar", file);

    const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
        method: "PUT",
        body: fd,
        credentials: "include", // не виставляй вручну Content-Type
    });

    if (!res.ok) throw new Error(`Update failed: ${res.status}`);

    // Новий бек: 200 + JSON {"username": "..."}
    const ct = res.headers.get("content-type") || "";
    if (res.status !== 204 && ct.includes("application/json")) {
        const data = (await res.json()) as UsernameDto;
        if (data?.username) return data.username;
    }

    // Фолбек для 204: повертаємо те, що просили встановити (або поточне)
    return cmd.newUsername?.trim() || username;
}
