// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";

import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
    const nav = useNavigate();
    const location = useLocation();
    const { refresh } = useAuth();
    const query = new URLSearchParams(location.search);
    const logoutMsg = query.get("logout");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        const res = await login({ username, password });
        setSubmitting(false);

        if (res.success) {
            await refresh();
            nav("/", { replace: true });
        } else {
            setError(res.error ?? "Неправильний логін або пароль!");
        }
    }

    return (
        <>
            {/* ПК */}
            <DesktopTopbar />
            <DesktopSidebar />

            {/* Мобілка */}
            <MobileTopbar />
            <MobileSidebar />

            <div className="auth-wrapper container-fluid">
                <div className="card p-4 shadow auth-card" style={{ maxWidth: 420, margin: "40px auto" }}>
                    <h2 className="text-center mb-3">Вхід</h2>

                    {logoutMsg && (
                        <div className="alert alert-success text-center">
                            Ви успішно вийшли з системи.
                        </div>
                    )}
                    {error && <div className="alert alert-danger text-center">{error}</div>}

                    <form onSubmit={onSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Логін</label>
                            <input
                                id="username"
                                type="text"
                                className="form-control"
                                placeholder="Введіть логін"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Пароль</label>
                            <input
                                id="password"
                                type="password"
                                className="form-control"
                                placeholder="Введіть пароль"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        <button className="btn btn-primary w-100" disabled={submitting} type="button"
                                onClick={onSubmit}>
                            {submitting ? "Входимо..." : "Увійти"}
                        </button>
                    </form>

                    <p className="mt-3 text-center">
                        Ще не зареєстровані? <Link to="/register">Створити акаунт</Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
