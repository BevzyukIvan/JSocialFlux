import React, { useCallback, useEffect, useRef, useState } from "react";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";

import { searchUsers, UserCardDTO, UserSlice } from "../api/search";
import UserCard from "../components/UserCard";
import "./search.css";

const SearchPage: React.FC = () => {
    const [input, setInput] = useState<string>("");
    const [query, setQuery] = useState<string>("");           // “зафіксований” запит
    const [items, setItems] = useState<UserCardDTO[]>([]);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [hasNext, setHasNext] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [initial, setInitial] = useState<boolean>(true);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const loadedOnce = useRef(false); // проти подвійного виклику у StrictMode

    const runSearch = useCallback(
        async (reset: boolean) => {
            if (loading) return;
            if (!query.trim()) {
                // порожній запит — очистимо
                setItems([]);
                setHasNext(false);
                setNextCursor(null);
                return;
            }
            setLoading(true);
            try {
                const slice: UserSlice = await searchUsers(
                    query.trim(),
                    reset ? undefined : nextCursor ?? undefined,
                    20
                );

                setItems((prev) => {
                    if (reset) return slice.content;
                    // невелика дедуплікація
                    const seen = new Set(prev.map((u) => u.username));
                    const fresh = slice.content.filter((u) => !seen.has(u.username));
                    return [...prev, ...fresh];
                });
                setHasNext(slice.hasNext);
                setNextCursor(slice.nextCursor);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
                setInitial(false);
            }
        },
        [query, nextCursor, loading]
    );

    // сабміт форми — зафіксувати запит і виконати пошук заново
    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setItems([]);
        setNextCursor(null);
        setHasNext(false);
        setInitial(true);
        setQuery(input);
    }

    // коли змінився query — запускаємо новий пошук (першу сторінку)
    useEffect(() => {
        if (!loadedOnce.current) {
            loadedOnce.current = true;
            return;
        }
        void runSearch(true);
    }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

    // infinite scroll
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasNext && !loading) {
                void runSearch(false);
            }
        }, { rootMargin: "200px" });
        io.observe(el);
        return () => io.disconnect();
    }, [hasNext, loading, runSearch]);

    const showEmptyState = !query.trim() && !items.length && !loading;
    const showNotFound = !!query.trim() && !items.length && !loading && !initial;

    return (
        <>
            {/* ПК */}
            <DesktopTopbar />
            <DesktopSidebar />

            {/* Мобілка */}
            <MobileTopbar />
            <MobileSidebar />

            <div className="main-content">
                <div className="search-wrapper">
                    <div className="search-box">
                        <form onSubmit={onSubmit} className="d-flex">
                            <input
                                type="text"
                                className="form-control me-2"
                                placeholder="Пошук користувачів..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button type="submit" className="btn btn-dark d-flex align-items-center px-3">
                                <i className="bi bi-search" />
                            </button>
                        </form>
                    </div>

                    {/* стани */}
                    {showEmptyState && (
                        <p className="text-center text-muted">Введіть імʼя користувача для пошуку.</p>
                    )}
                    {showNotFound && (
                        <p className="text-center text-muted">Нічого не знайдено.</p>
                    )}

                    {/* результати */}
                    {items.length > 0 && (
                        <div className="user-list">
                            {items.map((u) => (
                                <UserCard key={u.username} user={u} />
                            ))}
                        </div>
                    )}

                    {/* sentinel для infinite scroll */}
                    <div ref={sentinelRef} className="py-3 text-center text-muted">
                        {loading && query.trim() ? "Завантаження..." : ""}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SearchPage;
