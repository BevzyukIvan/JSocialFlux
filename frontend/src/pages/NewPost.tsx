// frontend/src/pages/NewPost.tsx
import React, { useState } from "react";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../api/posts";
import { useNavigate } from "react-router-dom";

const NewPost: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const text = content.trim();
        if (!text) {
            setError("Введіть текст поста.");
            return;
        }
        setSubmitting(true);
        try {
            await createPost(text);
            const username = user?.username ?? "";
            navigate(`/users/${encodeURIComponent(username)}?tab=posts`, {
                replace: true,
            });
        } catch (err: any) {
            setError(err?.message || "Не вдалося створити пост.");
        } finally {
            setSubmitting(false);
        }
    }

    function cancel() {
        const username = user?.username ?? "";
        navigate(`/users/${encodeURIComponent(username)}?tab=posts`);
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
                <div className="container form-narrow">
                    <h2 className="mb-4 text-center">Створити новий пост</h2>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={onSubmit} noValidate>
                        <div className="mb-3">
                            <label htmlFor="content" className="form-label">Зміст</label>
                            <textarea
                                id="content"
                                className="form-control"
                                rows={4}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Що нового?"
                                required
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <button className="btn btn-primary" disabled={submitting}>
                                {submitting ? "Публікуємо…" : "Опублікувати"}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={cancel}>
                                Скасувати
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default NewPost;
