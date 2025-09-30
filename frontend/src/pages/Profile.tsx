import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import {
    Cursor2,
    UserProfileDTO,
    fetchProfile,
    fetchUserPosts,
    fetchUserPhotos,
    PostCardDTO,
    PhotoCardDTO,
    deleteProfileItem,
    followUser,
    unfollowUser,
} from "../api/profile";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { startPrivateChat } from "../api/chats";

const DEF_AVATAR = "/images/default-avatar.png";
type Tab = "photos" | "posts";

const Profile: React.FC = () => {
    const { username = "" } = useParams();
    const { user: me, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfileDTO | null>(null);
    const [tab, setTab] = useState<Tab>("photos");

    // posts
    const [posts, setPosts] = useState<PostCardDTO[]>([]);
    const [pCursor, setPCursor] = useState<Cursor2>(null);
    const [pHasNext, setPHasNext] = useState(true);

    // photos
    const [photos, setPhotos] = useState<PhotoCardDTO[]>([]);
    const [phCursor, setPhCursor] = useState<Cursor2>(null);
    const [phHasNext, setPhHasNext] = useState(true);

    const [loading, setLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const firstLoadFiredRef = useRef(false);

    // гонки / анти-даблклік для follow
    const [opId, setOpId] = useState(0);
    const [clickLock, setClickLock] = useState(false);

    // load profile
    useEffect(() => {
        setProfile(null);
        void (async () => {
            const p = await fetchProfile(username);
            setProfile(p);
        })();
    }, [username]);

    // reset lists when username or tab changes
    useEffect(() => {
        setPosts([]);
        setPCursor(null);
        setPHasNext(true);

        setPhotos([]);
        setPhCursor(null);
        setPhHasNext(true);

        firstLoadFiredRef.current = false;
    }, [username, tab]);

    const canDelete = useCallback(
        () => !!me && (isAdmin || me.username === username),
        [isAdmin, me, username]
    );

    const load = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            if (tab === "photos") {
                if (!phHasNext) return;
                const slice = await fetchUserPhotos(username, phCursor ?? undefined, 9);
                setPhotos(prev => {
                    const seen = new Set(prev.map(x => x.id));
                    const fresh = slice.content.filter(x => !seen.has(x.id));
                    return [...prev, ...fresh];
                });
                setPhHasNext(slice.hasNext);
                setPhCursor(slice.nextCursor ?? null);
            } else {
                if (!pHasNext) return;
                const slice = await fetchUserPosts(username, pCursor ?? undefined, 9);
                setPosts(prev => {
                    const seen = new Set(prev.map(x => x.id));
                    const fresh = slice.content.filter(x => !seen.has(x.id));
                    return [...prev, ...fresh];
                });
                setPHasNext(slice.hasNext);
                setPCursor(slice.nextCursor ?? null);
            }
        } finally {
            setLoading(false);
        }
    }, [loading, tab, username, phHasNext, phCursor, pHasNext, pCursor]);

    // initial load
    useEffect(() => {
        if (firstLoadFiredRef.current) return;
        firstLoadFiredRef.current = true;
        void load();
    }, [load, username, tab]);

    // infinite scroll
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) void load(); },
            { rootMargin: "400px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [load]);

    // delete handlers
    async function onDeletePost(id: number) {
        if (!confirm("Видалити пост?")) return;
        const ok = await deleteProfileItem("post", id);
        if (ok) setPosts(prev => prev.filter(p => p.id !== id));
        else alert("403 – немає прав");
    }

    async function onDeletePhoto(id: number) {
        if (!confirm("Видалити фото?")) return;
        const ok = await deleteProfileItem("photo", id);
        if (ok) setPhotos(prev => prev.filter(p => p.id !== id));
        else alert("403 – немає прав");
    }

    // follow toggle
    async function toggleFollow() {
        if (!profile || !me || me.username === profile.username) return;
        if (clickLock) return;

        setClickLock(true);
        setTimeout(() => setClickLock(false), 250);

        const myOp = opId + 1;
        setOpId(myOp);

        const prev = profile;
        const next: UserProfileDTO = {
            ...prev,
            following: !prev.following,
            followersCnt: prev.following ? prev.followersCnt - 1 : prev.followersCnt + 1,
        };
        setProfile(next);

        try {
            if (!prev.following) await followUser(prev.username);
            else await unfollowUser(prev.username);
        } catch {
            setProfile(p => (opId < myOp ? prev : p ?? prev));
            alert("Не вдалося змінити підписку.");
        }
    }

    // start/open private chat
    const onWrite = useCallback(async (uname: string) => {
        try {
            const opened = await startPrivateChat(uname);
            navigate(`/chats/${opened.chatId}`);
        } catch {
            alert("Не вдалося відкрити приватний чат.");
        }
    }, [navigate]);

    const isMe = profile?.username === me?.username;
    const canEditProfile = isMe || isAdmin;

    const header = useMemo(() => {
        if (!profile) return null;
        const ava = profile.avatar || DEF_AVATAR;

        return (
            <div className="text-center mb-4">
                <img
                    src={ava}
                    alt="avatar"
                    className="profile-avatar mb-3"
                    width={120}
                    height={120}
                />
                <h3 className="mb-2">{profile.username}</h3>

                {/* КНОПКА РЕДАГУВАННЯ — лише для свого профілю */}
                {canEditProfile && (
                    <div className="d-flex justify-content-center mb-3">
                        <a
                            className="btn btn-sm btn-outline-secondary"
                            href={`/users/${profile.username}/edit`}
                        >
                            ✎ Редагувати профіль
                        </a>
                    </div>
                )}

                {/* Кнопки фолову/написати — тільки на чужому профілі */}
                {!isMe && me && (
                    <div className="d-flex justify-content-center gap-2 flex-wrap mb-3 align-items-center">
                        <button
                            className={`btn btn-sm ${profile.following ? "btn-outline-danger" : "btn-outline-primary"}`}
                            disabled={clickLock}
                            onClick={() => void toggleFollow()}
                        >
                            {profile.following ? "Відписатись" : "Підписатись"}
                        </button>

                        {profile.username && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => void onWrite(profile.username)}
                            >
                                ✉ Написати
                            </button>
                        )}

                        {profile.follower && (
                            <span className="text-muted small ms-2">(Підписаний на вас)</span>
                        )}
                    </div>
                )}

                <div className="d-flex justify-content-center gap-4 mb-2 flex-wrap align-items-center">
                    <a className="text-decoration-none" href={`/users/${profile.username}/network?tab=followers`}>
                        <strong>{profile.followersCnt}</strong> Читачі
                    </a>
                    <a className="text-decoration-none" href={`/users/${profile.username}/network?tab=following`}>
                        <strong>{profile.followingCnt}</strong> Стежить
                    </a>
                </div>
            </div>
        );
    }, [profile, me, clickLock, onWrite, isMe]);

    return (
        <>
            {/* ПК */}
            <DesktopTopbar />
            <DesktopSidebar />

            {/* Мобілка */}
            <MobileTopbar />
            <MobileSidebar />

            <div className="main-content">
                <div className="feed" style={{ maxWidth: 600 }}>
                    {header}

                    {/* Кнопка створення контенту — лише для свого профілю */}
                    {isMe && (
                        <div className="text-center mb-3">
                            {tab === "photos" ? (
                                <a className="btn btn-sm btn-outline-success" href="/photos/new">+ Нове фото</a>
                            ) : (
                                <a className="btn btn-sm btn-outline-primary" href="/posts/new">+ Новий пост</a>
                            )}
                        </div>
                    )}

                    {/* Перемикач табів */}
                    <div className="d-flex justify-content-center gap-4 mb-3">
                        <button
                            className={`btn btn-sm tab-button ${tab === "photos" ? "active" : ""}`}
                            onClick={() => setTab("photos")}
                        >
                            Фото
                        </button>
                        <button
                            className={`btn btn-sm tab-button ${tab === "posts" ? "active" : ""}`}
                            onClick={() => setTab("posts")}
                        >
                            Пости
                        </button>
                    </div>

                    {/* PHOTOS GRID */}
                    {tab === "photos" && (
                        <div className="profile-photos-grid">
                            {photos.map(ph => (
                                <div className="photo-tile" key={ph.id}>
                                    <a href={`/photos/${ph.id}`} aria-label="Відкрити фото">
                                        <img src={ph.url} alt={ph.description ?? "photo"} />
                                    </a>
                                    {canDelete() && (
                                        <div className="tile-delete">
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => void onDeletePhoto(ph.id)}
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* POSTS LIST */}
                    {tab === "posts" && (
                        <div className="profile-posts">
                            {posts.map(p => (
                                <div className="post-card" key={p.id}>
                                    <div className="post-meta small text-muted mb-1">
                                        {new Date(p.createdAt).toLocaleString()}
                                        {p.edited && <span> · змінено</span>}
                                    </div>

                                    <a href={`/posts/${p.id}`} className="text-decoration-none">
                                        <div className="post-content">{p.content}</div>
                                    </a>

                                    {canDelete() && (
                                        <div className="delete-btn-wrapper">
                                            <button
                                                className="btn btn-sm btn-outline-danger btn-delete"
                                                onClick={() => void onDeletePost(p.id)}
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {(tab === "photos" ? phHasNext : pHasNext) && (
                        <div ref={sentinelRef} className="py-4 text-center text-muted">
                            {loading ? "Завантаження..." : "Прокрути нижче, щоб завантажити ще"}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Profile;
