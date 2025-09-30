import React from "react";
import { Link } from "react-router-dom";
import { useUI } from "../../context/UIContext";
import { useAuth } from "../../context/AuthContext";
import "./mobile-topbar.css";

const MobileTopbar: React.FC = () => {
    const { toggleSidebar } = useUI();
    const { user } = useAuth();

    const avatar =
        user?.avatar && user.avatar.trim().length > 0
            ? user.avatar
            : "/images/default-avatar.png";

    return (
        <div className="mt-topbar">
            <button
                id="sidebarToggle"
                className="mt-burger"
                onClick={toggleSidebar}
                aria-label="Меню"
            >
                ☰
            </button>

            <Link to="/" className="mt-brand">JSocial</Link>

            <div className="mt-actions">
                {user ? (
                    <>
                        <Link to={`/users/${user.username}`} className="mt-user">
                            <img src={avatar} alt="avatar" className="mt-avatar" />
                            <span className="mt-username">{user.username}</span>
                        </Link>
                        {/* НЕ logout() тут! Переходимо на сторінку підтвердження */}
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
        </div>
    );
};

export default MobileTopbar;
