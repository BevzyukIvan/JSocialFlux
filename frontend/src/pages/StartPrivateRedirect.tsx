import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startPrivateChat } from '../api/chats';

const StartPrivateRedirect: React.FC = () => {
    const { username = '' } = useParams();
    const nav = useNavigate();
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const dto = await startPrivateChat(username);
                nav(`/chats/${dto.chatId}`, { replace: true });
            } catch (e: any) {
                setErr(e?.message ?? 'Не вдалося відкрити приватний чат');
            }
        })();
    }, [username, nav]);

    return (
        <div className="main-content">
            <div className="container py-5 text-center">
                {err ? <div className="alert alert-danger">{err}</div> : 'Відкриваємо чат…'}
            </div>
        </div>
    );
};

export default StartPrivateRedirect;
