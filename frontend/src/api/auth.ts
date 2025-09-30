// src/api/auth.ts

export type LoginRequest = { username: string; password: string };
export type RegisterRequest = { username: string; password: string };
export type JwtResponse = { success?: boolean; token?: string; error?: string };

// ==== Base URL ====
// Локально (Vite proxy): залишай VITE_API_BASE порожнім.
// У проді: вкажи повний бекенд-домен у .env.production
//   VITE_API_BASE=https://jsocialflux-production.up.railway.app
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

function url(path: string): string {
    return BASE ? `${BASE}${path}` : path;
}

// ==== Загальна утиліта для запитів ====
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem("jwt_token"); // якщо зберігаєш токен на фронті
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(url(path), {
        ...options,
        credentials: "include", // щоб HttpOnly куки передавались
        headers,
    });
}

// ==== API функції ====
export async function getMe(): Promise<{ username: string } | null> {
    const res = await apiFetch("/api/auth/me");
    if (!res.ok) {
        console.error("Failed to fetch user data");
        return null;
    }
    return res.json();
}

export async function logout(): Promise<void> {
    await apiFetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("jwt_token");
}

export async function login(req: LoginRequest): Promise<JwtResponse> {
    const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(req),
    });

    let data: JwtResponse | undefined;
    try { data = await res.json(); } catch {}

    if (!res.ok) {
        return { success: false, error: data?.error || "Помилка авторизації" };
    }
    return { success: true, token: data?.token };
}

export async function register(req: RegisterRequest): Promise<{ ok: boolean; error?: string }> {
    const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(req),
    });

    let data: JwtResponse | undefined;
    try { data = await res.json(); } catch {}

    if (res.ok && (data?.success === true || !!data?.token)) {
        return { ok: true };
    }
    if (res.status === 409) {
        return { ok: false, error: data?.error || "Користувач уже існує" };
    }
    return { ok: false, error: data?.error || `Помилка реєстрації (${res.status})` };
}
