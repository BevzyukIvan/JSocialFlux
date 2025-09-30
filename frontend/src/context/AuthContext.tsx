import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Role = string; // бек може надіслати "ADMIN" або "ROLE_ADMIN"
export type CurrentUser = { username: string; avatar?: string | null; role?: Role } | null;

type AuthCtx = {
    user: CurrentUser;
    loading: boolean;
    refresh: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<CurrentUser>>;
    logout: () => Promise<void>;
    isAdmin: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

// прибираємо префікс ROLE_, приводимо до верхнього регістру
function normalizeRole(r?: string | null): string {
    if (!r) return "";
    const up = r.toUpperCase();
    return up.startsWith("ROLE_") ? up.slice(5) : up;
}
function computeIsAdmin(u: CurrentUser): boolean {
    return normalizeRole(u?.role) === "ADMIN";
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<CurrentUser>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BASE}/api/auth/me`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json(); // { username, avatar, role }
                setUser({
                    username: data?.username,
                    avatar: data?.avatar ?? null,
                    role: data?.role ?? null, // може бути "ADMIN" або "ROLE_ADMIN"
                });
            } else {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void refresh(); }, [refresh]);

    const logout = useCallback(async () => {
        await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
        setUser(null);
    }, []);

    return (
        <Ctx.Provider value={{
            user,
            loading,
            refresh,
            setUser,
            logout,
            isAdmin: computeIsAdmin(user),
        }}>
            {children}
        </Ctx.Provider>
    );
};

export function useAuth(): AuthCtx {
    const v = useContext(Ctx);
    if (!v) throw new Error("useAuth must be inside AuthProvider");
    return v;
}
