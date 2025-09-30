import React from "react";
import { NavLink } from "react-router-dom";
import { useUI } from "../../context/UIContext";
import { useAuth } from "../../context/AuthContext";
import "./mobile-sidebar.css";

const MobileSidebar: React.FC = () => {
    const { sidebarOpen, closeSidebar } = useUI();
    const { user } = useAuth();

    return (
        <>
            <div className={`ms-sidebar ${sidebarOpen ? "show" : ""}`}>
                <div className="ms-inner">
                    <h4 className="ms-brand">JSocial</h4>
                    <NavLink to="/" className="ms-link" onClick={closeSidebar}>🏠 Головна</NavLink>
                    <NavLink to="/search" className="ms-link" onClick={closeSidebar}>🔍 Пошук</NavLink>
                    {user && (
                        <>
                            <NavLink to="/chats" className="ms-link" onClick={closeSidebar}>💬 Чати</NavLink>
                            <NavLink to={`/users/${user.username}`} className="ms-link" onClick={closeSidebar}>👤 Профіль</NavLink>
                        </>
                    )}
                </div>
            </div>
            <div className={`ms-overlay ${sidebarOpen ? "show" : ""}`} onClick={closeSidebar} />
        </>
    );
};

export default MobileSidebar;
