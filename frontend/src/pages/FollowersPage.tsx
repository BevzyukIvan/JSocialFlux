// frontend/src/pages/FollowersPage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import { fetchFollowers, fetchFollowing, UserItem, UserSlice } from "../api/follow";

type Tab = "followers" | "following";

const DEF_AVATAR = "/images/default-avatar.png";

const FollowersPage: React.FC = () => {
    const { username = "" } = useParams();
    const [sp, setSp] = useSearchParams();
    const tab: Tab = (sp.get("tab") as Tab) || "followers";
    const query = sp.get("q") || "";

    const [items, setItems] = useState<UserItem[]>([]);
    const [cursor, setCursor] = useState<number | null>(null);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const [err, setErr] = useState<string | null>(null);

    // при зміні юзернейма/табу/пошуку — ресет
    useEffect(() => {
        setItems([]);
        setCursor(null);
        setHasNext(true);
    }, [username, tab, query]);

    const load = useCallback(async () => {
        if (loading || !hasNext) return;
        setLoading(true);
        setErr(null);
        try {
            let slice;
            if (tab === "followers") {
                slice = await fetchFollowers(username, cursor ?? undefined, 20, query);
            } else {
                slice = await fetchFollowing(username, cursor ?? undefined, 20, query);
            }

            const fresh = (slice?.items ?? []).filter(u => u && u.username);
            setItems(prev => {
                const seen = new Set(prev.map(u => u.username));
                return [...prev, ...fresh.filter(u => !seen.has(u.username))];
            });

            setHasNext(Boolean(slice?.hasNext));
            setCursor(typeof slice?.nextCursor === "number" ? slice!.nextCursor : null);
        } catch (e: any) {
            setErr(e?.message ?? "Помилка завантаження");
        } finally {
            setLoading(false);
        }
    }, [loading, hasNext, tab, username, cursor, query]);

    // перший запит
    useEffect(() => { void load(); }, [load]);

    // нескінченна прокрутка
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) void load();
        }, { rootMargin: "300px" });
        io.observe(el);
        return () => io.disconnect();
    }, [load]);

    // зміна табу/пошуку
    const switchTab = (t: Tab) => {
        const next = new URLSearchParams(sp);
        next.set("tab", t);
        setSp(next, { replace: true });
    };

    const onSubmitSearch: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const q = (fd.get("q") as string) || "";
        const next = new URLSearchParams(sp);
        if (q) next.set("q", q); else next.delete("q");
        setSp(next, { replace: true });
    };

    const title = useMemo(() => `${username} – Список`, [username]);

    return (
        <>
            <DesktopTopbar />
            <DesktopSidebar />
            <MobileTopbar />
            <MobileSidebar />

            <div className="main-content">
                <div className="feed" style={{ maxWidth: 500 }}>
                    <h3 className="text-center mb-4 d-none d-lg-block">{title}</h3>

                    <div className="d-flex justify-content-center gap-4 mb-3">
                        <button
                            className={`btn btn-sm tab-button ${tab === "followers" ? "active" : ""}`}
                            onClick={() => switchTab("followers")}
                        >
                            Читачі
                        </button>
                        <button
                            className={`btn btn-sm tab-button ${tab === "following" ? "active" : ""}`}
                            onClick={() => switchTab("following")}
                        >
                            Стежить
                        </button>
                    </div>

                    <form className="d-flex mb-3 search-form" onSubmit={onSubmitSearch}>
                        <input type="text" name="q" className="form-control me-2" placeholder="Пошук за ім'ям..." defaultValue={query} />
                        <button type="submit" className="btn btn-dark d-flex align-items-center px-3">
                            <i className="bi bi-search"></i>
                        </button>
                    </form>

                    <ul className="list-group">
                        {items.map(u => (
                            <li key={u.username} className="list-group-item">
                                <div className="user-entry d-flex align-items-center gap-2">
                                    <img src={u.avatar || DEF_AVATAR} alt="avatar" width={48} height={48} style={{ borderRadius: "50%", objectFit: "cover" }} />
                                    <Link to={`/users/${u.username}`} className="text-decoration-none fw-medium text-dark">{u.username}</Link>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {hasNext && (
                        <div ref={sentinelRef} className="py-4 text-center text-muted">
                            {loading ? "Завантаження…" : "Прокрути нижче, щоб завантажити ще"}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FollowersPage;
