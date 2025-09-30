import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./desktop-topbar.css";

const DesktopTopbar: React.FC = () => {
    const { user } = useAuth();

    const avatar =
        user?.avatar && user.avatar.trim().length > 0
            ? user.avatar
            : "/images/default-avatar.png";

    return (
        <div className="dt-topbar">
            <div /> {/* ліву частину лишаємо порожньою; бренд є у DesktopSidebar */}
            <div className="dt-auth">
                {user ? (
                    <>
                        <img src={avatar} alt="avatar" className="dt-avatar" />
                        <Link to={`/users/${user.username}`} className="dt-username">
                            {user.username}
                        </Link>
                        {/* НЕ logout() тут! Переходимо на сторінку підтвердження */}
                        <Link to="/logout" className="btn btn-sm btn-outline-danger">
                            Вийти
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-sm btn-outline-primary">Увійти</Link>
                        <Link to="/register" className="btn btn-sm btn-primary ms-2">Реєстрація</Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default DesktopTopbar;
