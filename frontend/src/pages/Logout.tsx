import React, { useState } from "react";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LogoutPage: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    async function onConfirm(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        await logout();                           // очистка jwt cookie на бекенді + user=null на фронті
        setSubmitting(false);
        navigate("/login?logout=1", { replace: true });
    }

    function onCancel() {
        navigate("/", { replace: true });
    }

    return (
        <>
            {/* ПК */}
            <DesktopTopbar />
            <DesktopSidebar />

            {/* Мобілка */}
            <MobileTopbar />
            <MobileSidebar />

            {/* Центрована картка як у thymeleaf-версії */}
            <div className="auth-wrapper container-fluid">
                <div className="card p-4 shadow text-center auth-card" style={{ maxWidth: 400 }}>
                    <h2 className="mb-2">Вихід із системи</h2>
                    <p className="mb-4">Ви впевнені, що хочете вийти?</p>

                    <form onSubmit={onConfirm}>
                        <button type="submit" className="btn btn-danger w-100" disabled={submitting}>
                            {submitting ? "Виходимо..." : "Вийти"}
                        </button>
                    </form>

                    <p className="mt-3">
                        <button type="button" className="btn btn-outline-secondary w-100" onClick={onCancel}>
                            Скасувати
                        </button>
                    </p>
                </div>
            </div>
        </>
    );
};

export default LogoutPage;
