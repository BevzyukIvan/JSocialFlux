// frontend/src/pages/PhotoPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import { fetchPhoto, PhotoResponseDTO } from "../api/items";
import { useAuth } from "../context/AuthContext";
import Comments from "../components/Comments";

const DEF_AVATAR = "/images/default-avatar.png";

const PhotoPage: React.FC = () => {
    const { id } = useParams();
    const photoId = Number(id);
    const { user, isAdmin } = useAuth();

    const [data, setData] = useState<PhotoResponseDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setErr(null);
        fetchPhoto(photoId)
            .then(setData)
            .catch((e) => setErr(String(e)))
            .finally(() => setLoading(false));
    }, [photoId]);

    const canEdit = !!user && (isAdmin || user.username === data?.ownerUsername);

    return (
        <>
            <DesktopTopbar />
            <DesktopSidebar />

            <MobileTopbar />
            <MobileSidebar />

            <div className="main-content">
                <div className="feed" style={{ maxWidth: 720 }}>
                    {loading && <div className="text-center text-muted py-5">Завантаження…</div>}
                    {err && <div className="alert alert-danger">{err}</div>}
                    {data && (
                        <>
                            <div className="card shadow mb-4">
                                <img src={data.url} className="card-img-top img-fluid" alt="Фото" />
                                <div className="card-body d-flex gap-3 align-items-start">
                                    <img
                                        src={data.ownerAvatar || DEF_AVATAR}
                                        alt="avatar"
                                        style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                                    />
                                    <div className="flex-grow-1">
                                        <h5 className="mb-1">
                                            <Link to={`/users/${data.ownerUsername}`} className="text-decoration-none">
                                                {data.ownerUsername}
                                            </Link>
                                        </h5>
                                        {data.description && <p className="mb-1">{data.description}</p>}
                                        <small className="text-muted">
                                            {new Date(data.uploadedAt).toLocaleString()}
                                        </small>
                                        {canEdit && (
                                            <div className="mt-2">
                                                <Link to={`/photos/${data.id}/edit`} className="btn btn-sm btn-outline-primary">
                                                    Редагувати
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Коментарі з нескінченною прокруткою */}
                            <Comments type="photo" itemId={photoId} />
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default PhotoPage;
