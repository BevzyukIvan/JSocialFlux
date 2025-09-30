// frontend/src/components/Comments.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
    Cursor2,
    PostCommentDTO,
    PhotoCommentDTO,
    fetchPostComments,
    fetchPhotoComments,
    createPostComment,
    createPhotoComment,
    deletePostComment,
    deletePhotoComment,
} from "../api/comments";
import { Link } from "react-router-dom";

type Kind = "post" | "photo";
type AnyComment = PostCommentDTO | PhotoCommentDTO;

type Props = {
    type: Kind;
    itemId: number;
};

const DEF_AVATAR = "/images/default-avatar.png";

const Comments: React.FC<Props> = ({ type, itemId }) => {
    const { user, isAdmin } = useAuth();

    const [items, setItems] = useState<AnyComment[]>([]);
    const [cursor, setCursor] = useState<Cursor2>(null);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [text, setText] = useState("");

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const loadedOnceRef = useRef(false);

    const load = useCallback(async () => {
        if (loading || !hasNext) return;
        setLoading(true);
        try {
            const slice =
                type === "post"
                    ? await fetchPostComments(itemId, cursor ?? undefined, 10)
                    : await fetchPhotoComments(itemId, cursor ?? undefined, 10);

            // дедуп, якщо IO/StrictMode викликне двічі
            setItems((prev) => {
                const seen = new Set(prev.map((c) => c.id));
                const fresh = slice.items.filter((c) => !seen.has(c.id));
                return [...prev, ...fresh];
            });
            setHasNext(slice.hasNext);
            setCursor(slice.nextCursor ?? null);
        } finally {
            setLoading(false);
        }
    }, [type, itemId, cursor, hasNext, loading]);

    useEffect(() => {
        setItems([]);
        setCursor(null);
        setHasNext(true);
        loadedOnceRef.current = false;
    }, [type, itemId]);

    useEffect(() => {
        if (loadedOnceRef.current) return;
        loadedOnceRef.current = true;
        void load();
    }, [load]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) void load();
        }, { rootMargin: "300px" });
        io.observe(el);
        return () => io.disconnect();
    }, [load]);

    const canDelete = useCallback(
        (c: AnyComment) => !!user && (isAdmin || user.username === c.authorUsername),
        [user, isAdmin]
    );

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const content = text.trim();
        if (!content) return;

        setSending(true);
        try {
            const created =
                type === "post"
                    ? await createPostComment(itemId, content)
                    : await createPhotoComment(itemId, content);

            // Показуємо одразу зверху
            setItems((prev) => [created, ...prev]);
            setText("");
        } finally {
            setSending(false);
        }
    }

    async function onDelete(id: number) {
        if (!confirm("Видалити коментар?")) return;
        const ok =
            type === "post"
                ? await deletePostComment(itemId, id)
                : await deletePhotoComment(itemId, id);
        if (ok) setItems((prev) => prev.filter((c) => c.id !== id));
        else alert("403 – немає прав");
    }

    return (
        <div className="mb-4">
            <h5 className="mb-3">Коментарі</h5>

            {/* Форма додавання тільки для авторизованих */}
            {user ? (
                <form className="mb-3" onSubmit={onSubmit}>
          <textarea
              className="form-control"
              rows={3}
              placeholder="Залиште коментар…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
          />
                    <div className="d-flex justify-content-end mt-2">
                        <button className="btn btn-primary" disabled={sending || !text.trim()}>
                            {sending ? "Надсилаємо…" : "Надіслати"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="alert alert-light border">
                    Щоб коментувати, <Link to="/login">увійдіть</Link> або <Link to="/register">зареєструйтесь</Link>.
                </div>
            )}

            {/* Список коментарів */}
            {items.map((c) => {
                const ava = c.authorAvatar || DEF_AVATAR;
                const when = c.createdAt ? new Date(c.createdAt).toLocaleString() : "";
                const uname = c.authorUsername || "—";
                return (
                    <div className="card mb-2" key={c.id}>
                        <div className="card-body d-flex gap-3 align-items-start">
                            <img
                                src={ava}
                                alt="avatar"
                                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                            />
                            <div className="flex-grow-1">
                                <h6 className="mb-1">
                                    {/* якщо бек повертає username, посилання працюватиме */}
                                    <Link to={`/users/${uname}`} className="text-decoration-none">{uname}</Link>
                                </h6>
                                <p className="mb-1" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                                    {c.content}
                                </p>
                                <small className="text-muted">{when}</small>

                                {canDelete(c) && (
                                    <div className="mt-2">
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => void onDelete(c.id)}>
                                            Видалити
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Інфініті-сентінел */}
            {hasNext && (
                <div ref={sentinelRef} className="py-3 text-center text-muted">
                    {loading ? "Завантаження…" : "Прокрутіть, щоб підвантажити ще"}
                </div>
            )}
        </div>
    );
};

export default Comments;
