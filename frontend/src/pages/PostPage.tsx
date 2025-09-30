// frontend/src/pages/PostPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import { fetchPost, PostResponseDTO } from "../api/items";
import { useAuth } from "../context/AuthContext";
import Comments from "../components/Comments";

const DEF_AVATAR = "/images/default-avatar.png";

const PostPage: React.FC = () => {
    const { id } = useParams();
    const postId = Number(id);
    const { user, isAdmin } = useAuth();

    const [data, setData] = useState<PostResponseDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setErr(null);
        fetchPost(postId)
            .then(setData)
            .catch((e) => setErr(String(e)))
            .finally(() => setLoading(false));
    }, [postId]);

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
                            <div className="card mb-4">
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
                                        <p className="mb-1">{data.content}</p>
                                        <small className="text-muted">
                                            {new Date(data.createdAt).toLocaleString()}
                                        </small>
                                        {data.edited && <span className="text-muted fst-italic ms-2">(відредаговано)</span>}
                                        {canEdit && (
                                            <div className="mt-2">
                                                <Link to={`/posts/${data.id}/edit`} className="btn btn-sm btn-outline-primary">
                                                    Редагувати
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Коментарі з нескінченною прокруткою */}
                            <Comments type="post" itemId={postId} />
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default PostPage;
