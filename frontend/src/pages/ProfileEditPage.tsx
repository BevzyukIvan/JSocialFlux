// src/pages/ProfileEditPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";

import { useAuth } from "../context/AuthContext";
import { updateProfile, ProfileUpdateResponse }  from "../api/users";

const DEF_AVATAR = "/images/default-avatar.png";

const ProfileEditPage: React.FC = () => {
    const nav = useNavigate();
    const { username = "" } = useParams();
    const { user: me, setUser, isAdmin } = useAuth();

    // локальні стани форми
    const [newUsername, setNewUsername] = useState(username);
    const [deleteAvatar, setDeleteAvatar] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const editingSelf = !!me && me.username === username;
    const allowEditName = editingSelf; // адміну не даємо міняти ім'я

    // Дозволяємо: власника або адміна. Інакше — редірект.
    useEffect(() => {
        if (!me) return;
        if (!editingSelf && !isAdmin) {
            nav(`/users/${encodeURIComponent(me.username)}`, { replace: true });
        }
    }, [me, editingSelf, isAdmin, nav]);

    // превʼю аватарки
    useEffect(() => {
        if (!avatarFile) {
            setAvatarPreview(null);
            return;
        }
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    // якщо видалення увімкнено — чистимо файл
    useEffect(() => {
        if (deleteAvatar) {
            setAvatarFile(null);
            if (fileInputRef.current && "value" in fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [deleteAvatar]);

    const canSave = useMemo(() => {
        if (saving) return false;
        if (allowEditName) {
            // власник: можна зберегти, якщо змінили імʼя або позначили видалення, або обрали файл
            return (
                (newUsername && newUsername !== username) ||
                deleteAvatar ||
                (!!avatarFile && !deleteAvatar)
            );
        }
        // адмін (чужий профіль): тільки аватар
        return deleteAvatar || (!!avatarFile && !deleteAvatar);
    }, [saving, allowEditName, newUsername, username, deleteAvatar, avatarFile]);

    const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0] ?? null;
        setAvatarFile(file);
    };

    const onClearFile = () => {
        setAvatarFile(null);
        if (fileInputRef.current && "value" in fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (!me || (!editingSelf && !isAdmin)) return;

        setSaving(true);
        setErr(null);
        try {
            const payloadName = allowEditName ? newUsername.trim() : username;

            // ТЕПЕР updateProfile повертає { username, avatar }
            const resp: ProfileUpdateResponse = await updateProfile(
                username,
                { newUsername: payloadName, deleteAvatar },
                avatarFile || undefined
            );

            // ОНОВЛЮЄМО КОНТЕКСТ, якщо редагуємо СЕБЕ — одразу побачимо новий аватар у топбарі
            if (editingSelf) {
                setUser((prev) =>
                    prev
                        ? {
                            ...prev,
                            username: resp.username || prev.username,
                            avatar: resp.avatar ?? null,
                        }
                        : prev
                );
            }

            // Навігація на актуальну сторінку профілю (цільового користувача)
            const nextUser = (resp.username || username).trim();
            nav(`/users/${encodeURIComponent(nextUser)}`, { replace: true });
        } catch (ex: any) {
            setErr(ex?.message ?? "Помилка збереження");
        } finally {
            setSaving(false);
        }
    };

    const title = useMemo(() => "Редагування профілю", []);

    // Аватар у превʼю:
    const currentAvatar = editingSelf ? me?.avatar : null;

    return (
        <>
            {/* Десктоп */}
            <DesktopTopbar />
            <DesktopSidebar />

            {/* Мобілка */}
            <MobileTopbar />
            <MobileSidebar />

            <div className="main-content">
                <div className="container py-4" style={{ maxWidth: 600 }}>
                    <h2 className="mb-4 text-center d-none d-lg-block">{title}</h2>

                    {err && <div className="alert alert-danger text-center">{err}</div>}

                    <form onSubmit={onSubmit} encType="multipart/form-data">
                        {/* Username — показуємо ТІЛЬКИ власнику */}
                        {allowEditName && (
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">Ім’я користувача</label>
                                <input
                                    id="username"
                                    className="form-control"
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    required
                                    autoComplete="off"
                                />
                                <div className="form-text">Ви можете змінити свій @username.</div>
                            </div>
                        )}

                        {/* Інфо для адміна */}
                        {!allowEditName && (
                            <div className="alert alert-info small">
                                Адміністратори можуть змінювати лише аватар користувача.
                            </div>
                        )}

                        {/* Avatar */}
                        <div className="mb-3">
                            <label className="form-label">Аватар</label>

                            <div className="d-flex align-items-center gap-3 mb-2">
                                <img
                                    src={avatarPreview || currentAvatar || DEF_AVATAR}
                                    alt="avatar"
                                    width={72}
                                    height={72}
                                    style={{ borderRadius: "50%", objectFit: "cover", border: "1px solid #dbdbdb" }}
                                />

                                <div className="d-flex flex-column gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="form-control"
                                        onChange={onPickFile}
                                        disabled={deleteAvatar}
                                        accept="image/*"
                                    />
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={onClearFile}
                                            disabled={!avatarFile}
                                        >
                                            Очистити файл
                                        </button>
                                        <div className="form-check">
                                            <input
                                                id="delAvatar"
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={deleteAvatar}
                                                onChange={(e) => setDeleteAvatar(e.target.checked)}
                                            />
                                            <label htmlFor="delAvatar" className="form-check-label">
                                                Видалити аватар
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="form-text">
                                Якщо увімкнено «Видалити аватар», файл ігнорується.
                            </div>
                        </div>

                        {/* Submit */}
                        <button className="btn btn-primary w-100" type="submit" disabled={!canSave}>
                            {saving ? "Збереження…" : "Зберегти зміни"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Мобільний layout */}
            <style>{`
        .main-content {
          margin-left: 240px;
          padding: 40px 0;
          flex-grow: 1;
          display: flex;
          justify-content: center;
        }
        @media (max-width: 991.98px) {
          .topbar { display: none !important; }
          .mobile-topbar { display: flex !important; }

          .main-content {
            margin-left: 0;
            padding-top: 52px;
            padding-left: 12px;
            padding-right: 12px;
          }

          .mobile-topbar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 52px;
            background: #fff;
            border-bottom: 1px solid #dbdbdb;
            z-index: 1050;
            padding: 0 8px;
            align-items: center;
            justify-content: space-between;
          }

          .sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            width: 240px;
            transform: translateX(-100%);
            transition: transform .3s ease;
            z-index: 1040;
            background: #fff;
            overflow-y: auto;
            box-shadow: 2px 0 6px rgba(0,0,0,.08);
          }
          .sidebar.show { transform: translateX(0); }

          #sidebarOverlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.4);
            display: none;
            z-index: 1030;
          }
          #sidebarOverlay.show { display: block; }
        }
      `}</style>
        </>
    );
};

export default ProfileEditPage;
