import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./desktop-sidebar.css";

const DesktopSidebar: React.FC = () => {
    const { user } = useAuth();

    return (
        <aside className="ds-sidebar">
            <div className="ds-inner">
                <h4 className="ds-brand">JSocial</h4>

                <NavLink to="/" className="ds-link">🏠 Головна</NavLink>
                <NavLink to="/search" className="ds-link">🔍 Пошук</NavLink>

                {user && (
                    <>
                        <NavLink to="/chats" className="ds-link">💬 Чати</NavLink>
                        <NavLink to={`/users/${user.username}`} className="ds-link">👤 Профіль</NavLink>
                    </>
                )}
            </div>
        </aside>
    );
};

export default DesktopSidebar;
