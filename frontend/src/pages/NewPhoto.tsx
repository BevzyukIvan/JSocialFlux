// frontend/src/pages/NewPhoto.tsx
import React, { useRef, useState } from "react";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import { useAuth } from "../context/AuthContext";
import { createPhoto } from "../api/photos";
import { useNavigate } from "react-router-dom";

const NewPhoto: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement>(null!);

    function onPick(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        setError(null);
        if (f) {
            const url = URL.createObjectURL(f);
            setPreview((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });
        } else {
            setPreview((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) {
            setError("Оберіть зображення.");
            fileRef.current.focus();
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await createPhoto(file, description);
            const username = user?.username ?? "";
            navigate(`/users/${encodeURIComponent(username)}?tab=photos`, {
                replace: true,
            });
        } catch (err: any) {
            setError(err?.message || "Не вдалося завантажити фото.");
        } finally {
            setSubmitting(false);
        }
    }

    function cancel() {
        const username = user?.username ?? "";
        navigate(`/users/${encodeURIComponent(username)}?tab=photos`);
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
                    <h2 className="mb-4 text-center">Завантажити нове фото</h2>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={onSubmit} noValidate>
                        <div className="mb-3">
                            <label htmlFor="file" className="form-label">Оберіть зображення</label>
                            <input
                                ref={fileRef}
                                id="file"
                                type="file"
                                className="form-control"
                                accept="image/*"
                                onChange={onPick}
                                required
                            />
                        </div>

                        {preview && (
                            <div className="mb-3">
                                <img src={preview} alt="preview" className="img-fluid rounded" />
                            </div>
                        )}

                        <div className="mb-3">
                            <label htmlFor="desc" className="form-label">Опис (необов'язково)</label>
                            <textarea
                                id="desc"
                                className="form-control"
                                rows={3}
                                maxLength={1000}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Додайте опис до фото…"
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <button className="btn btn-primary" disabled={submitting}>
                                {submitting ? "Завантажуємо…" : "Завантажити"}
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

export default NewPhoto;
