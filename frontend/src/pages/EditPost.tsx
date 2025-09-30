import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import { fetchPost, updatePostContent, PostResponseDTO } from "../api/items";
import { useAuth } from "../context/AuthContext";

const EditPost: React.FC = () => {
    const { id } = useParams();
    const postId = Number(id);
    const nav = useNavigate();
    const { user, isAdmin } = useAuth();

    const [data, setData] = useState<PostResponseDTO | null>(null);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setErr(null);
        fetchPost(postId)
            .then(d => { setData(d); setContent(d.content ?? ""); })
            .catch(e => setErr(String(e)))
            .finally(() => setLoading(false));
    }, [postId]);

    const canEdit = !!user && data && (isAdmin || user.username === data.ownerUsername);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canEdit) return;
        const text = content.trim();
        if (!text) { setErr("Вміст не може бути порожнім."); return; }

        setSaving(true);
        setErr(null);
        try {
            await updatePostContent(postId, text);
            nav(`/posts/${postId}`, { replace: true });
        } catch (e) {
            setErr("Не вдалося зберегти. Перевірте права доступу.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <DesktopTopbar /><DesktopSidebar />
            <MobileTopbar /><MobileSidebar />

            <div className="main-content">
                <div className="feed" style={{ maxWidth: 600 }}>
                    {loading && <div className="text-center text-muted py-5">Завантаження…</div>}
                    {err && <div className="alert alert-danger">{err}</div>}
                    {data && !canEdit && (
                        <div className="alert alert-warning">Немає прав на редагування.</div>
                    )}

                    {data && canEdit && (
                        <div className="card p-4 shadow">
                            <h2 className="mb-3 text-center">Редагувати пост</h2>
                            <form onSubmit={onSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="content" className="form-label">Зміст</label>
                                    <textarea
                                        id="content"
                                        className="form-control"
                                        rows={4}
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="d-flex gap-2 justify-content-end">
                                    <button className="btn btn-primary" disabled={saving}>
                                        {saving ? "Зберігаємо…" : "Зберегти"}
                                    </button>
                                    <Link to={`/posts/${postId}`} className="btn btn-secondary">Скасувати</Link>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default EditPost;
