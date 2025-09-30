// src/pages/GroupChatCreatePage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";

import { useAuth } from "../context/AuthContext";
import { createGroupChat } from "../api/chats";
import { fetchUserSuggestions, searchUsersAll, UserCardDTO, UserSlice } from "../api/group";

const DEF_AVATAR = "/images/default-avatar.png";

const UserRow: React.FC<{
    u: UserCardDTO;
    checked: boolean;
    onToggle: (username: string) => void;
}> = ({ u, checked, onToggle }) => (
    <label className="d-flex align-items-center gap-2 py-2 px-2 border rounded mb-2" style={{ cursor: "pointer" }}>
        <input
            type="checkbox"
            className="form-check-input"
            checked={checked}
            onChange={() => onToggle(u.username)}
            onClick={(e) => e.stopPropagation()}
            style={{ marginRight: 8 }}
        />
        <img
            src={u.avatar || DEF_AVATAR}
            alt=""
            width={40}
            height={40}
            style={{ borderRadius: "50%", objectFit: "cover" }}
        />
        <span className="fw-medium">{u.username}</span>
    </label>
);

const GroupChatCreatePage: React.FC = () => {
    const nav = useNavigate();
    const { user: me } = useAuth();

    const [groupName, setGroupName] = useState("");
    const [q, setQ] = useState("");
    const [appliedQ, setAppliedQ] = useState("");

    const [picked, setPicked] = useState<Set<string>>(new Set());

    // Моя мережа (followers/following): /api/users/suggestions
    const [netItems, setNetItems] = useState<UserCardDTO[]>([]);
    const [netCursor, setNetCursor] = useState<number | null>(null);
    const [netHasNext, setNetHasNext] = useState(true);
    const [netLoading, setNetLoading] = useState(false);

    // Глобальний пошук: /api/users/search
    const [globItems, setGlobItems] = useState<UserCardDTO[]>([]);
    const [globCursor, setGlobCursor] = useState<number | null>(null);
    const [globHasNext, setGlobHasNext] = useState(true);
    const [globLoading, setGlobLoading] = useState(false);

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Скидання при зміні рядка пошуку
    useEffect(() => {
        setNetItems([]); setNetCursor(null); setNetHasNext(true);
        setGlobItems([]); setGlobCursor(null); setGlobHasNext(true);
    }, [appliedQ]);

    // Завантаження "Моя мережа"
    const loadNetwork = useCallback(async () => {
        if (netLoading || !netHasNext) return;
        setNetLoading(true);
        try {
            const slice: UserSlice = await fetchUserSuggestions(
                appliedQ || undefined,
                netCursor ?? undefined,
                20
            );
            const fresh = slice.content ?? [];
            setNetItems(prev => {
                const seen = new Set(prev.map(x => x.username));
                return [...prev, ...fresh.filter(x => !seen.has(x.username))];
            });
            setNetHasNext(Boolean(slice.hasNext));
            setNetCursor(slice.nextCursor ?? null);
        } finally {
            setNetLoading(false);
        }
    }, [appliedQ, netCursor, netHasNext, netLoading]);

    // Завантаження "Глобальний пошук"
    const loadGlobal = useCallback(async () => {
        if (!appliedQ.trim()) return;
        if (globLoading || !globHasNext) return;
        setGlobLoading(true);
        try {
            const slice: UserSlice = await searchUsersAll(appliedQ, globCursor ?? undefined, 20);
            const fresh = slice.content ?? [];
            setGlobItems(prev => {
                const seen = new Set(prev.map(x => x.username));
                return [...prev, ...fresh.filter(x => !seen.has(x.username))];
            });
            setGlobHasNext(Boolean(slice.hasNext));
            setGlobCursor(slice.nextCursor ?? null);
        } finally {
            setGlobLoading(false);
        }
    }, [appliedQ, globCursor, globHasNext, globLoading]);

    // Початково тягнемо мережу
    useEffect(() => { void loadNetwork(); }, [loadNetwork]);

    // Інфініт-скрол
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            if (!entries[0].isIntersecting) return;
            if (netHasNext) void loadNetwork();
            else if (appliedQ.trim()) void loadGlobal();
        }, { rootMargin: "300px" });
        io.observe(el);
        return () => io.disconnect();
    }, [loadNetwork, loadGlobal, netHasNext, appliedQ]);

    const onSubmitSearch: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        setAppliedQ(q.trim());
    };

    const togglePick = (username: string) => {
        if (me && username === me.username) return;
        setPicked(prev => {
            const next = new Set(prev);
            next.has(username) ? next.delete(username) : next.add(username);
            return next;
        });
    };

    const canCreate = useMemo(
        () => groupName.trim().length > 0 && picked.size >= 1,
        [groupName, picked.size]
    );

    const onCreate = async () => {
        if (!canCreate) return;
        try {
            const usernames = Array.from(picked);
            const dto = await createGroupChat({ name: groupName.trim(), usernames });
            nav(`/chats/${dto.chatId}`, { replace: true });
        } catch {
            alert("Не вдалося створити груповий чат.");
        }
    };

    return (
        <>
            <DesktopTopbar />
            <DesktopSidebar />
            <MobileTopbar />
            <MobileSidebar />

            <div className="main-content">
                <div className="container gc-page" style={{ maxWidth: 720 }}>
                    <h3 className="mb-3 text-center d-none d-lg-block">Новий груповий чат</h3>

                    <div className="card mb-3">
                        <div className="card-body">
                            <label className="form-label">Назва групи</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Напр., «Команда продукту»"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>
                    </div>

                    <form className="d-flex mb-3" onSubmit={onSubmitSearch}>
                        <input
                            type="text"
                            className="form-control me-2"
                            placeholder="Пошук за ім'ям…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <button type="submit" className="btn btn-dark d-flex align-items-center px-3">
                            <i className="bi bi-search" />
                        </button>
                    </form>

                    {picked.size > 0 && (
                        <div className="mb-3 d-flex flex-wrap" style={{ gap: 8 }}>
                            {Array.from(picked).map(u => (
                                <span key={u} className="badge text-bg-secondary" style={{ fontSize: 14 }}>
                  {u}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-link text-white ms-1 p-0"
                                        onClick={() => togglePick(u)}
                                        aria-label="Видалити"
                                    >
                    ✕
                  </button>
                </span>
                            ))}
                        </div>
                    )}

                    {/* Коли рядок пошуку порожній — показуємо лише рекомендації */}
                    {!appliedQ.trim() && netItems.length > 0 && (
                        <>
                            <div className="mb-1 text-muted small">Рекомендації для вас</div>
                            <div className="mb-3">
                                {netItems.map(u => (
                                    <UserRow
                                        key={`net:${u.username}`}
                                        u={u}
                                        checked={picked.has(u.username)}
                                        onToggle={togglePick}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Коли є пошук — спочатку «Моя мережа», потім «Глобальний пошук» */}
                    {appliedQ.trim() && (
                        <>
                            {(netItems.length > 0 || netLoading || netHasNext) && (
                                <>
                                    <div className="mb-1 text-muted small">У моїй мережі</div>
                                    <div className="mb-3">
                                        {netItems.map(u => (
                                            <UserRow
                                                key={`net:${u.username}`}
                                                u={u}
                                                checked={picked.has(u.username)}
                                                onToggle={togglePick}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Глобальний пошук показуємо, як тільки мережеві результати вичерпались */}
                            {!netHasNext && (
                                <>
                                    <div className="border-top my-3" />
                                    <div className="mb-1 text-muted small">Глобальний пошук</div>
                                    <div className="mb-3">
                                        {globItems.map(u => (
                                            <UserRow
                                                key={`glob:${u.username}`}
                                                u={u}
                                                checked={picked.has(u.username)}
                                                onToggle={togglePick}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    <div ref={sentinelRef} className="py-3 text-center text-muted">
                        {(netLoading || globLoading) ? "Завантаження…" : ""}
                    </div>

                    {/* sticky-бар з кнопкою по центру колонки */}
                    <div className="fab-holder">
                        <button
                            className="btn btn-success btn-lg create-fab"
                            disabled={!canCreate}
                            onClick={() => void onCreate()}
                        >
                            Створити чат ({picked.size})
                        </button>
                    </div>

                    <style>{`
            /* ===== Sticky центрована FAB всередині колонки ===== */

            /* тримає кнопку по центру ширини колонки/контейнера */
            .gc-page .fab-holder {
              position: sticky;
              bottom: 16px;           /* відступ від низу вьюпорта або скрол-контейнера */
              z-index: 1100;
              display: flex;
              justify-content: center; /* ЦЕНТР по ширині «прямокутника» */
              pointer-events: none;     /* кліки проходять лише на кнопку */
            }

            /* сама кнопка — клікабельна */
            .gc-page .fab-holder .create-fab {
              pointer-events: auto;
              border-radius: 999px;
              padding-inline: 22px;
              box-shadow: 0 6px 18px rgba(0,0,0,.15);
            }

            /* щоб останні елементи списку не ховались під кнопкою */
            .gc-page {
              padding-bottom: 96px;
            }

            /* ===== Мобільні корекції ===== */
            @media (max-width: 991.98px) {
              html, body { margin:0; overscroll-behavior:contain; }
              .topbar { display:none!important; }
              .mobile-topbar {
                display:flex!important; position:fixed; top:0; left:0; width:100%; height:52px;
                background:#fff; border-bottom:1px solid #dbdbdb; z-index:1050; padding:0 8px; align-items:center;
              }
              .main-content {
                position:fixed; top:52px; bottom:0; left:0; right:0; overflow:auto; margin:0; padding:0;
              }
              .gc-page { padding-bottom: 84px; }
              .gc-page .fab-holder { bottom: 12px; }
            }
          `}</style>
                </div>
            </div>
        </>
    );
};

export default GroupChatCreatePage;
