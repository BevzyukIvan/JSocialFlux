import React, {useCallback, useEffect, useRef, useState} from "react";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import FeedItemCard from "../components/FeedItemCard";
import { deleteItem, fetchFeed, FeedItemDTO, FeedType, FeedCursor } from "../api/feed";
import { useAuth } from "../context/AuthContext";

const Home: React.FC = () => {
    const { user, isAdmin } = useAuth();

    const [items, setItems] = useState<FeedItemDTO[]>([]);
    const [nextCursor, setNextCursor] = useState<FeedCursor>(null);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const loadedRef = useRef(false);

    const load = useCallback(async () => {
        if (loading || !hasNext) return;
        setLoading(true);
        try {
            const slice = await fetchFeed(nextCursor ?? undefined, 10);
            setItems(prev => {
                const seen = new Set(prev.map(it => `${it.type}-${it.id}`));
                const fresh = slice.content.filter(it => !seen.has(`${it.type}-${it.id}`));
                return [...prev, ...fresh];
            });
            setHasNext(slice.hasNext);
            setNextCursor(slice.nextCursor ?? null);
        } finally {
            setLoading(false);
        }
    }, [loading, hasNext, nextCursor]);

    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        void load();
    }, [load]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) void load();
        }, { rootMargin: "200px" });
        io.observe(el);
        return () => io.disconnect();
    }, [load]);

    async function handleDelete(type: FeedType, id: number) {
        if (!confirm("Видалити?")) return;
        const ok = await deleteItem(type, id);
        if (ok) setItems(prev => prev.filter(it => !(it.id === id && it.type === type)));
        else alert("403 – немає прав");
    }

    return (
        <>
            {/* ПК */}
            <DesktopTopbar />
            <DesktopSidebar />

            {/* Мобілка */}
            <MobileTopbar />
            <MobileSidebar />

            <div className="main-content">
                <div className="feed">
                    {items.map(item => {
                        const isOwner = user?.username === item.username;
                        const canDelete = isOwner || isAdmin;
                        return (
                            <FeedItemCard
                                key={`${item.type}-${item.id}`}
                                item={item}
                                onDelete={canDelete ? handleDelete : undefined}
                            />
                        );
                    })}

                    {hasNext && (
                        <div ref={sentinelRef} className="py-4 text-center text-muted">
                            {loading ? "Завантаження..." : "Прокрути нижче, щоб завантажити ще"}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Home;
