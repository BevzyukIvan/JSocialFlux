// src/api/auth.ts
export type LoginRequest = { username: string; password: string };
export type RegisterRequest = { username: string; password: string };
export type JwtResponse = { success?: boolean; token?: string; error?: string };

/**
 * Для деву через Vite proxy лишай BASE порожнім.
 * Якщо треба звертатись напряму (без проксі) — задай VITE_API_BASE у .env(.local).
 */
// Це ваш існуючий код
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
function url(path: string): string {
    return BASE ? `${BASE}${path}` : path;
}

// 1. Створіть нову функцію для авторизованих запитів
async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem("jwt_token"); // або звідки ви його берете

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.append("Authorization", `Bearer ${token}`);
    }
    headers.append("Content-Type", "application/json");

    return fetch(url(path), {
        ...options,
        credentials: "include",
        headers: headers,
    });
}

// 2. Тепер створіть функції для роботи з API, використовуючи authFetch
export async function getMe(): Promise<{ username: string } | null> {
    const res = await authFetch("/api/auth/me"); // Використовуємо нову функцію
    if (!res.ok) {
        console.error("Failed to fetch user data");
        return null;
    }
    return res.json();
}

export async function logout(): Promise<void> {
    // Для logout також потрібен токен, щоб бекенд знав, чию сесію завершити
    await authFetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("jwt_token"); // Не забудьте видалити токен і на фронті
}

export async function login(req: LoginRequest): Promise<JwtResponse> {
    const res = await fetch(url("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(req),
    });
    let data: JwtResponse | undefined;
    try { data = await res.json(); } catch {}
    if (!res.ok) return { success: false, error: data?.error || "Помилка авторизації" };
    return { success: true, token: data?.token };
}

export async function register(req: RegisterRequest): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(url("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(req),
    });
    let data: JwtResponse | undefined;
    try { data = await res.json(); } catch {}
    if (res.ok && (data?.success === true || !!data?.token)) return { ok: true };
    if (res.status === 409) return { ok: false, error: data?.error || "Користувач уже існує" };
    return { ok: false, error: data?.error || `Помилка реєстрації (${res.status})` };
}
