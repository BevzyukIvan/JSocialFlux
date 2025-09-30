import React, { useState } from "react";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";

type FieldErrors = {
    username?: string;
    password?: string;
    confirmPassword?: string;
    global?: string;
};

const RegisterPage: React.FC = () => {
    const nav = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    function validate(): boolean {
        const e: FieldErrors = {};
        const u = username.trim();

        if (!u) e.username = "Логін обов'язковий";
        else if (u.length < 3) e.username = "Мінімум 3 символи";

        if (!password) e.password = "Пароль обов'язковий";
        else if (password.length < 6) e.password = "Мінімум 6 символів";

        if (confirmPassword !== password) e.confirmPassword = "Паролі не співпадають";

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});
        if (!validate()) return;

        setSubmitting(true);
        const res = await register({ username: username.trim(), password });
        setSubmitting(false);

        if (res.ok) {
            nav("/", { replace: true });
        } else {
            setErrors({ global: res.error || "Не вдалося зареєструватися" });
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
                <div className="card p-4 shadow auth-card">
                    <h2 className="text-center mb-3">Реєстрація</h2>

                    {errors.global && (
                        <div className="alert alert-danger">{errors.global}</div>
                    )}

                    <form onSubmit={onSubmit} noValidate>
                        {/* Username */}
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Логін</label>
                            <input
                                id="username"
                                type="text"
                                className={`form-control ${errors.username ? "is-invalid" : ""}`}
                                placeholder="Введіть логін"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                            {errors.username && (
                                <div className="invalid-feedback">{errors.username}</div>
                            )}
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Пароль</label>
                            <input
                                id="password"
                                type="password"
                                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                placeholder="Введіть пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            {errors.password && (
                                <div className="invalid-feedback">{errors.password}</div>
                            )}
                        </div>

                        {/* Confirm */}
                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="form-label">Підтвердьте пароль</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                                placeholder="Повторіть пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            {errors.confirmPassword && (
                                <div className="invalid-feedback">{errors.confirmPassword}</div>
                            )}
                        </div>

                        <button className="btn btn-primary w-100" disabled={submitting}>
                            {submitting ? "Реєструємо..." : "Зареєструватися"}
                        </button>
                    </form>

                    <p className="mt-3 text-center">
                        Вже маєте акаунт? <a href="/login">Увійти</a>
                    </p>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;
