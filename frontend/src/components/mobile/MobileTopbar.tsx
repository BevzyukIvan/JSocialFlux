// src/components/mobile/MobileTopbar.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useUI } from "../../context/UIContext";
import { useAuth } from "../../context/AuthContext";
import { pickChatAvatar, getAvatar } from "../../utils/avatar";
import "./mobile-topbar.css";

type Props = {
    mode?: "default" | "chat";
    title?: string;
    avatar?: string | null;
    isGroup?: boolean;
};

const MobileTopbar: React.FC<Props> = ({
                                           mode = "default",
                                           title,
                                           avatar,
                                           isGroup = false,
                                       }) => {
    const { toggleSidebar } = useUI();
    const { user } = useAuth();

    const meAvatar = getAvatar(user?.avatar);
    const chatAvatar = pickChatAvatar(isGroup, avatar || undefined);

    return (
        <div className={`mt-topbar ${mode === "chat" ? "is-chat" : "is-default"}`}>
            {/* ЛІВО */}
            <div className="mt-left">
                <button
                    id="sidebarToggle"
                    className="mt-burger"
                    onClick={toggleSidebar}
                    aria-label="Меню"
                >
                    ☰
                </button>
                {mode === "default" && <Link to="/" className="mt-brand">JSocial</Link>}
            </div>

            {/* ЦЕНТР */}
            {mode === "chat" ? (
                <Link
                    to={title ? `/users/${encodeURIComponent(title)}` : "/"}
                    className="mt-center-link"
                    aria-label={title ? `Перейти до профілю ${title}` : "На головну"}
                >
                    <div className="mt-center">
                        <img src={chatAvatar} alt="" className="mt-avatar mt-avatar--chat" />
                        <span className="mt-chat-title" title={title || ""}>
        {title || "Чат"}
      </span>
                    </div>
                </Link>
            ) : (
                <div />
            )}

            {/* ПРАВО */}
            {mode === "chat" ? (
                <div className="mt-right">{/* пусто у чаті */}</div>
            ) : (
                <div className="mt-right">
                    {user ? (
                        <>
                            {/* 👇 ПОРЯДОК: АВАТАР → НІК → ВИЙТИ */}
                            <Link to={`/users/${user.username}`} className="mt-me">
                                <img src={meAvatar} alt="me" className="mt-avatar" />
                                <span className="mt-me-name">{user.username}</span>
                            </Link>
                            <Link to="/logout" className="btn btn-sm btn-outline-danger">
                                Вийти
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-sm btn-outline-primary">Увійти</Link>
                            <Link to="/register" className="btn btn-sm btn-primary ms-1">Реєстрація</Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileTopbar;
