// src/pages/ChatListPage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import DesktopTopbar from '../components/desktop/DesktopTopbar';
import DesktopSidebar from '../components/desktop/DesktopSidebar';
import MobileTopbar from '../components/mobile/MobileTopbar';
import MobileSidebar from '../components/mobile/MobileSidebar';

import { useAuth } from '../context/AuthContext';
import { ChatSlice, ChatViewDTO, fetchMyChats } from '../api/chats';
import { WsClient } from '../ws/wsClient';
import { DEF_GROUP_AVATAR, pickChatAvatar } from '../utils/avatar';

const ChatCard: React.FC<{ chat: ChatViewDTO }> = ({ chat }) => (
    <Link to={`/chats/${chat.chatId}`} className="text-decoration-none text-dark">
        <div className="chatlist-item d-flex align-items-center gap-3">
            <img
                width={48}
                height={48}
                className="rounded-circle border"
                src={pickChatAvatar(chat.isGroup, chat.displayAvatar)}
                alt="Avatar"
            />
            <div className="chatlist-text flex-grow-1">
                <div className="fw-semibold chatlist-title">{chat.displayName}</div>
                <div className="text-muted chatlist-subtitle">{chat.lastMessage ?? ''}</div>
            </div>
        </div>
    </Link>
);

const ChatListPage: React.FC = () => {
    const { user } = useAuth();

    const [items, setItems] = useState<ChatViewDTO[]>([]);
    const [cursorTs, setCursorTs] = useState<number | null>(null);
    const [cursorId, setCursorId] = useState<number | null>(null);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const ioRef = useRef<IntersectionObserver | null>(null);

    const sortChats = useCallback((arr: ChatViewDTO[]) => {
        return arr.slice().sort((a, b) => {
            const ta = a.lastSentAt ? Date.parse(a.lastSentAt) : 0;
            const tb = b.lastSentAt ? Date.parse(b.lastSentAt) : 0;
            if (tb !== ta) return tb - ta;
            return b.chatId - a.chatId;
        });
    }, []);

    const load = useCallback(async () => {
        if (loading || !hasNext) return;
        setLoading(true);
        setErr(null);
        try {
            const slice: ChatSlice = await fetchMyChats(
                cursorTs ?? undefined,
                cursorId ?? undefined,
                20
            );

            // показуємо й порожні чати (новостворені групи)
            const fresh = (slice.items ?? []).filter(x => x && x.chatId);

            setItems(prev => {
                const seen = new Set(prev.map(x => x.chatId));
                const merged = [...prev, ...fresh.filter(x => !seen.has(x.chatId))];
                return sortChats(merged);
            });

            setHasNext(Boolean(slice.hasNext));
            setCursorTs(slice.nextCursorEpochMs ?? null);
            setCursorId(slice.nextCursorId ?? null);
        } catch (e: any) {
            setErr(e?.message ?? 'Помилка завантаження чатів');
        } finally {
            setLoading(false);
        }
    }, [loading, hasNext, cursorTs, cursorId, sortChats]);

    useEffect(() => { void load(); }, [load]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        ioRef.current?.disconnect();
        ioRef.current = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) void load(); },
            { rootMargin: '300px' }
        );

        if ('observe' in ioRef.current) {
            ioRef.current.observe(el);
        }
        return () => {
            ioRef.current?.disconnect();
            ioRef.current = null;
        };
    }, [load]);

    // live-превʼю
    useEffect(() => {
        const username = user?.username;
        if (!username) return;

        let alive = true;
        (async () => {
            await WsClient.ready();
            if (!alive) return;
            await WsClient.subscribe(`user:${username}:preview`);
            WsClient.ping();
        })();

        const off = WsClient.onMessage((json: any) => {
            if (typeof json !== 'object' || json == null) return;
            const cid = Number(json.chatId ?? json.id);
            if (!cid) return;

            setItems(prev => {
                const idx = prev.findIndex(x => x.chatId === cid);
                const copy = [...prev];

                if (idx >= 0) {
                    copy[idx] = {
                        ...copy[idx],
                        displayName: json.displayName ?? copy[idx].displayName,
                        displayAvatar: json.displayAvatar ?? copy[idx].displayAvatar,
                        lastMessage: (json.lastMessage ?? json.content ?? copy[idx].lastMessage) ?? null,
                        lastSentAt: (json.lastSentAt ?? json.sentAt ?? copy[idx].lastSentAt) ?? null,
                    };
                } else {
                    copy.push({
                        chatId: cid,
                        displayName: json.displayName ?? `Чат #${cid}`,
                        displayAvatar: json.displayAvatar ?? DEF_GROUP_AVATAR,
                        lastMessage: json.lastMessage ?? json.content ?? null,
                        lastSentAt: json.lastSentAt ?? json.sentAt ?? null,
                    } as ChatViewDTO);
                }
                return sortChats(copy);
            });
        });

        return () => {
            alive = false;
            off();
            (async () => {
                await WsClient.ready();
                await WsClient.unsubscribe(`user:${username}:preview`);
            })();
        };
    }, [user?.username, sortChats]);

    return (
        <>
            {/* ПК */}
            <DesktopTopbar />
            <DesktopSidebar />

            {/* Мобілка */}
            <MobileTopbar />
            <MobileSidebar />

            <div className="main-content">
                <div className="container chatlist-container">
                    {/* Хедер перенесений у ту ж «вузьку» колонку, що й картки */}
                    <div className="chatlist-inner mx-auto d-flex justify-content-end mb-3">
                        <Link
                            to="/chats/new-group"
                            className="btn btn-success rounded-pill shadow-sm d-inline-flex align-items-center gap-2 px-3 py-2 create-group-btn"
                        >
                            <i className="bi bi-people-fill" />
                            <span className="fw-semibold">Створити групу</span>
                        </Link>
                    </div>

                    {err && <div className="alert alert-danger">{err}</div>}
                    {items.length === 0 && !hasNext && !loading && (
                        <p className="text-center">У вас ще немає жодного чату.</p>
                    )}

                    {/* Центрована колонка з «картками» */}
                    <div className="chatlist-inner mx-auto">
                        {items.map(chat => <ChatCard key={chat.chatId} chat={chat} />)}
                    </div>

                    {hasNext && (
                        <div ref={sentinelRef} className="py-4 text-center text-muted">
                            {loading ? 'Завантаження…' : 'Прокрути нижче, щоб завантажити ще'}
                        </div>
                    )}
                </div>
            </div>

            {/* ЛОКАЛЬНІ СТИЛІ */}
            <style>{`
        .chatlist-container { max-width: 920px; }
        .chatlist-inner { max-width: 640px; }

        /* Кнопка створення: невеликий hover-ефект */
        .create-group-btn:hover {
          transform: translateY(-1px);
        }
        .create-group-btn:active {
          transform: translateY(0);
        }

        /* Картка чату */
        .chatlist-item {
          padding: 10px 12px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: box-shadow .15s ease, transform .04s ease, background-color .15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,.04);
          margin-bottom: 10px;
        }
        .chatlist-item:hover {
          background: #f9fafb;
          box-shadow: 0 2px 8px rgba(0,0,0,.06);
        }

        /* Текстові обмеження */
        .chatlist-text { min-width: 0; }
        .chatlist-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chatlist-subtitle { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        @media (max-width: 991.98px) {
          html, body { margin:0; overscroll-behavior:contain; }
          .topbar { display:none!important; }
          .mobile-topbar {
            display:flex!important; position:fixed; top:0; left:0; width:100%; height:52px;
            background:#fff; border-bottom:1px solid #dbdbdb; z-index:1050; padding:0 8px; align-items:center;
          }
          .main-content {
            position:fixed; top:52px; bottom:0; left:0; right:0; overflow:auto; margin:0; padding:0;
          }
          .chatlist-container { max-width:none; padding:12px 12px 80px; }
          .chatlist-inner   { max-width:720px; }
          .chatlist-item    { margin-bottom:12px; }
        }
      `}</style>
        </>
    );
};

export default ChatListPage;
