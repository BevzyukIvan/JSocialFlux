// src/pages/ChatPage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DesktopTopbar from "../components/desktop/DesktopTopbar";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import MobileTopbar from "../components/mobile/MobileTopbar";
import MobileSidebar from "../components/mobile/MobileSidebar";

import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    MessageDTO,
    MessageSlice,
    fetchMessages,
    sendMessage,
    deleteMessage,
} from "../api/messages";
import { fetchMyChats } from "../api/chats";
import { WsClient } from "../ws/wsClient";

const LONG_PRESS_MS = 500;

const ChatPage: React.FC = () => {
    const { chatId: chatIdStr } = useParams();
    const chatId = Number(chatIdStr);
    const { user, isAdmin } = useAuth();

    const [items, setItems] = useState<MessageDTO[]>([]);
    const [cursorTs, setCursorTs] = useState<number | null>(null);
    const [cursorId, setCursorId] = useState<number | null>(null);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [title, setTitle] = useState<string>("Чат");

    const boxRef = useRef<HTMLDivElement | null>(null);
    const topSentinelRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const busyRef = useRef(false);
    const hasNextRef = useRef(hasNext);
    const loadingRef = useRef(loading);
    const ioArmedRef = useRef(false);
    const ioRef = useRef<IntersectionObserver | null>(null);
    const firstLoadRef = useRef(true);

    useEffect(() => { hasNextRef.current = hasNext; }, [hasNext]);
    useEffect(() => { loadingRef.current = loading; }, [loading]);

    const canDeleteMsg = useCallback(
        (m: MessageDTO) => {
            if (!user) return false;
            return isAdmin || m.senderUsername === user.username;
        },
        [user, isAdmin]
    );

    const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString() + " " + new Date(iso).toLocaleTimeString().slice(0, 5);

    useEffect(() => {
        let abort = false;
        if (!Number.isFinite(chatId)) return;
        (async () => {
            try {
                const slice = await fetchMyChats(undefined, undefined, 200);
                const found = (slice.items ?? []).find(x => x.chatId === chatId);
                if (!abort && found?.displayName) setTitle(found.displayName);
            } catch { /* no-op */ }
        })();
        return () => { abort = true; };
    }, [chatId]);

    useEffect(() => {
        if (title !== "Чат" || !user) return;
        const other = [...items].reverse().find(m => m.senderUsername !== user.username);
        if (other?.senderUsername) setTitle(other.senderUsername);
    }, [items, title, user]);

    const scrollToBottom = useCallback(() => {
        const box = boxRef.current;
        if (!box) return;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                box.scrollTop = box.scrollHeight;
            });
        });
    }, []);

    const toAsc = (slice: MessageSlice) => (slice.items ?? []).slice().reverse();

    const loadInitialPage = useCallback(async () => {
        if (!Number.isFinite(chatId)) return;
        setLoading(true);
        setErr(null);
        try {
            const slice = await fetchMessages(chatId, undefined, undefined, 30);
            const asc = toAsc(slice);
            setItems(asc);
            setHasNext(Boolean(slice.hasNext));
            setCursorTs(slice.nextCursorEpochMs ?? null);
            setCursorId(slice.nextCursorId ?? null);
        } catch (e: any) {
            setErr(e?.message ?? "Помилка завантаження повідомлень");
        } finally {
            setLoading(false);
        }
    }, [chatId]);

    const loadOlder = useCallback(async () => {
        if (busyRef.current || loadingRef.current || !hasNextRef.current) return;
        busyRef.current = true;
        setLoading(true);
        setErr(null);
        try {
            const slice: MessageSlice = await fetchMessages(
                chatId,
                cursorTs ?? undefined,
                cursorId ?? undefined,
                30
            );
            const freshAsc = toAsc(slice);

            const box = boxRef.current;
            const oldH = box?.scrollHeight ?? 0;
            const oldTop = box?.scrollTop ?? 0;

            setItems(prev => {
                const seen = new Set(prev.map(x => x.id));
                const unique = freshAsc.filter(m => !seen.has(m.id));
                return unique.length ? [...unique, ...prev] : prev; // prepend
            });

            setHasNext(Boolean(slice.hasNext));
            setCursorTs(slice.nextCursorEpochMs ?? null);
            setCursorId(slice.nextCursorId ?? null);

            requestAnimationFrame(() => {
                if (box) box.scrollTop = (box.scrollHeight - oldH) + oldTop;
            });
        } catch (e: any) {
            setErr(e?.message ?? "Помилка завантаження повідомлень");
        } finally {
            setLoading(false);
            busyRef.current = false;
        }
    }, [chatId, cursorTs, cursorId]);

    useEffect(() => {
        if (!Number.isFinite(chatId)) return;

        setItems([]);
        setCursorTs(null);
        setCursorId(null);
        setHasNext(true);
        setErr(null);
        busyRef.current = false;
        ioArmedRef.current = false;
        firstLoadRef.current = true;

        (async () => {
            await loadInitialPage();
            scrollToBottom();
            requestAnimationFrame(() => { ioArmedRef.current = true; });
            firstLoadRef.current = false;
        })();
    }, [chatId, loadInitialPage, scrollToBottom]);

    useEffect(() => {
        const box = boxRef.current;
        const sentinel = topSentinelRef.current;
        if (!box || !sentinel) return;

        ioRef.current?.disconnect();

        const io = new IntersectionObserver(
            entries => {
                const e = entries[0];
                if (!ioArmedRef.current) return;
                if (!e.isIntersecting) return;
                if (loadingRef.current || !hasNextRef.current) return;

                io.unobserve(sentinel);
                void loadOlder().finally(() => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            if (hasNextRef.current) {
                                const s = topSentinelRef.current;
                                if (s) io.observe(s);
                            }
                        });
                    });
                });
            },
            { root: box as Element, rootMargin: "120px 0px 0px 0px", threshold: 0.0 }
        );

        io.observe(sentinel);
        ioRef.current = io;
        return () => io.disconnect();
    }, [loadOlder]);

    useEffect(() => {
        let alive = true;
        if (!Number.isFinite(chatId)) return;

        const channel = `chat:${chatId}`;

        (async () => {
            await WsClient.ready();
            if (!alive) return;
            await WsClient.subscribe(channel);
            WsClient.ping();
        })();

        const off = WsClient.onMessage((msg: any) => {
            if (msg?.chatId === chatId && msg?.id && msg?.content !== undefined) {
                setItems(prev => (prev.some(x => x.id === msg.id) ? prev : [...prev, msg]));
                if (title === "Чат" && user && msg.senderUsername !== user.username) {
                    setTitle(msg.senderUsername);
                }
                if (!firstLoadRef.current) scrollToBottom();
                return;
            }

            const getDeletedId = (m: any): number | null => {
                if (typeof m === "number") return m;
                if (typeof m === "string") {
                    const n = Number(m);
                    return Number.isFinite(n) ? n : null;
                }
                if (m && typeof m === "object") {
                    if (m.chatId === chatId && m.id && m.content === undefined) {
                        const n = Number(m.id);
                        return Number.isFinite(n) ? n : null;
                    }
                    const cand =
                        m.deletedId ??
                        m.messageId ??
                        (m.payload && (m.payload.deletedId ?? m.payload.id)) ??
                        (m.event === "deleted" && (m.id ?? m.messageId));
                    const n = Number(cand);
                    return Number.isFinite(n) ? n : null;
                }
                return null;
            };

            const delId = getDeletedId(msg);
            if (delId != null) {
                setItems(prev => prev.filter(x => x.id !== delId));
            }
        });

        return () => {
            alive = false;
            off();
            (async () => {
                await WsClient.ready();
                await WsClient.unsubscribe(channel);
            })();
        };
    }, [chatId, scrollToBottom, title, user]);

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        const val = inputRef.current?.value?.trim();
        if (!val || !Number.isFinite(chatId)) return;

        try {
            const saved: MessageDTO = await sendMessage(chatId, val);
            setItems(prev => (prev.some(x => x.id === saved.id) ? prev : [...prev, saved]));
            if (inputRef.current && "value" in inputRef.current) inputRef.current.value = "";
            scrollToBottom();
        } catch {
            alert("Не вдалося надіслати повідомлення.");
        }
    };

    const onDeleteMsg = async (id: number) => {
        if (!Number.isFinite(chatId)) return;
        if (!confirm("Видалити повідомлення?")) return;

        setItems(prev => {
            (onDeleteMsg as any)._rollback = prev;
            return prev.filter(x => x.id !== id);
        });

        try {
            await deleteMessage(chatId, id);
        } catch {
            setItems((onDeleteMsg as any)._rollback ?? []);
            alert("Не вдалося видалити.");
        } finally {
            (onDeleteMsg as any)._rollback = null;
        }
    };

    // long-press (мобільний) для показу кнопки видалення у власних повідомленнях
    const longPressTimers = useRef<Record<number, any>>({}).current;
    const onTouchStart = (msgId: number) => {
        longPressTimers[msgId] = setTimeout(() => {
            const el = document.querySelector<HTMLDivElement>(`.message[data-id="${msgId}"]`);
            if (el) el.classList.add("show-delete");
        }, LONG_PRESS_MS);
    };
    const onTouchEnd = (msgId: number) => {
        clearTimeout(longPressTimers[msgId]);
    };
    const onTouchMove = (msgId: number) => {
        clearTimeout(longPressTimers[msgId]);
    };
    const onClickMsg = (msgId: number) => {
        const el = document.querySelector<HTMLDivElement>(`.message[data-id="${msgId}"]`);
        if (el) el.classList.remove("show-delete");
    };

    const pageTitle = useMemo(() => title, [title]);

    return (
        <>
            <DesktopTopbar/>
            <DesktopSidebar/>
            <MobileTopbar/>
            <MobileSidebar/>

            <div className="main-content chat-main">
                <div className="chat-box">
                    <h5 className="mb-3 d-none d-lg-block">{pageTitle}</h5>

                    {err && <div className="alert alert-danger">{err}</div>}

                    <div ref={boxRef} className="messages-container">
                        <div ref={topSentinelRef}/>
                        {loading && items.length === 0 && <div className="text-center">Завантаження...</div>}

                        {items.map((m) => {
                            const mine = m.senderUsername === user?.username;
                            const canDel = mine && canDeleteMsg(m);
                            return (
                                <div
                                    key={m.id}
                                    data-id={m.id}
                                    className={`message ${mine ? "me" : "other"}`}
                                    onTouchStart={() => onTouchStart(m.id)}
                                    onTouchEnd={() => onTouchEnd(m.id)}
                                    onTouchMove={() => onTouchMove(m.id)}
                                    onClick={() => onClickMsg(m.id)}
                                >
                                    {/* для груп можна додати імʼя відправника, якщо потрібно */}
                                    <div>{m.content}</div>
                                    <div className="text-muted small mt-1 meta">
                                        {fmt(m.sentAt)}
                                        {canDel && (
                                            <button
                                                className="delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void onDeleteMsg(m.id);
                                                }}
                                                aria-label="Видалити повідомлення"
                                                title="Видалити"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Форма відправки — на мобільному фіксується знизу, з круглою кнопкою */}
                    <form onSubmit={onSubmit} className="d-flex gap-2 mt-3" id="messageForm">
                        <input
                            ref={inputRef}
                            id="messageInput"
                            type="text"
                            className="form-control"
                            placeholder="Ваше повідомлення…"
                            autoComplete="off"
                        />
                        <button id="sendBtn" className="btn btn-primary send-circle" type="submit"
                                aria-label="Надіслати">
                            <i className="bi bi-arrow-right-short text-white" aria-hidden="true"></i>
                        </button>
                    </form>
                </div>
            </div>

            {/* СТИЛІ під вигляд із шаблона */}
            <style>{`
              .chat-main {
                margin-left: 240px;
                padding: 40px 20px;
                flex-grow: 1;
            
                /* центримо вміст по горизонталі */
                display: flex;
                justify-content: center;
              }
            
              /* 50% ширини екрана на десктопі, по центру */
              .chat-box {
                width: 50vw;               /* рівно половина екрана */
                max-width: none;           /* не обмежуємо зверху */
                min-width: 560px;          /* необов'язково: щоб не став надто вузьким на невеликих ноутбуках */
                background: #fff;
                border: 1px solid #dbdbdb;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                padding: 20px;
              }
            
              .messages-container {
                display: flex;
                flex-direction: column;
                gap: 6px;
                height: 500px;
                overflow-y: auto;
              }
            
              .message {
                padding: 10px;
                border-radius: 16px;
                margin-bottom: 6px;
                max-width: 75%;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
              }
              .message.me { background: #3797ff; color: #fff; align-self: flex-end; }
              .message.other { background: #f1f1f1; align-self: flex-start; }
            
              .message .meta { display: inline-flex; align-items: center; gap: 6px; opacity: .85; }
              .message .delete-btn { visibility: hidden; background: none; border: none; margin-left: 2px; color: inherit; padding: 0; line-height: 1; cursor: pointer; }
              .message:hover .delete-btn { visibility: visible; }
              .message.me.show-delete .delete-btn { visibility: visible; }
            
              .send-circle {
                width: 44px; height: 44px; border-radius: 50%;
                padding: 0; display: flex; align-items: center; justify-content: center;
              }
              .send-circle i { font-size: 1.4rem; }
            
              /* МОБІЛКА: повна ширина і висота */
              @media (max-width: 991.98px) {
                html, body { margin: 0; overscroll-behavior: contain; }
                .topbar { display: none !important; }
            
                .mobile-topbar {
                  display: flex !important;
                  position: fixed; top: 0; left: 0; width: 100%; height: 52px;
                  background: #fff; border-bottom: 1px solid #dbdbdb; z-index: 1050;
                  padding: 0 8px; align-items: center;
                }
            
                .chat-main {
                  position: fixed;
                  top: 52px; bottom: 0; left: 0; right: 0;
                  overflow: hidden;
                  margin: 0; padding: 0;
                  display: block;            /* скидаємо flex, щоб коробка займала 100% */
                }
            
                .chat-box {
                  width: 100%;               /* повна ширина */
                  min-width: 0;              /* без мін. обмежень */
                  border: none; border-radius: 0;
                  height: 100%;
                  padding: 0;
                  display: flex; flex-direction: column;
                }
            
                .messages-container {
                  flex: 1 1 auto;
                  padding: 12px 12px 80px;
                  overflow-y: auto;
                  -webkit-overflow-scrolling: touch;
                  touch-action: pan-y;
                  overscroll-behavior-y: contain;
                  height: auto;
                }
            
                .message { max-width: 85%; font-size: 0.9rem; }
            
                #messageForm {
                  position: fixed;
                  left: 0; right: 0; bottom: 0;
                  padding: 8px 12px;
                  background: #fff;
                  border-top: 1px solid #dbdbdb;
                  display: flex; gap: 8px;
                  z-index: 1051;
                  will-change: bottom;
                  transition: bottom .25s ease;
                  margin: 0;
                }
                #messageInput { flex: 1; }
            
                /* на мобільному показуємо delete тільки через long-press */
                .message.me .delete-btn { visibility: hidden; opacity: 0; transition: opacity .15s; }
                .message.me.show-delete .delete-btn { visibility: visible; opacity: 1; }
              }
            `}</style>
        </>
    );
};

export default ChatPage;
