// src/ws/wsClient.ts

type WireMsg = { type: string; channel?: string };
type Listener = (data: any) => void;

/**
 * Підключення WS:
 * - через Vite proxy: залиш DIRECT_WS_URL порожнім ('')
 * - напряму до бекенду: вкажи повний URL, напр. 'ws://192.168.0.112:8080/ws'
 */
const DIRECT_WS_URL: string | undefined = undefined; // або '' якщо хочеш явно

export const WS_URL: string = (() => {
    // гарантуємо строку перед trim()
    const direct = (DIRECT_WS_URL || '').trim();
    if (direct) return direct;

    const { protocol, host } = window.location;
    const proto = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${host}/ws`;
})();

class WSWrapper {
    private ws: WebSocket | null = null;

    private openPromise: Promise<void> = Promise.resolve();
    private openResolve: (() => void) | null = null;

    private queue: WireMsg[] = [];
    private listeners: Listener[] = [];

    private connecting = false;
    private manualClosed = false;
    private retry = 0;
    private heartbeatTimer: number | null = null;

    private subscriptions = new Set<string>();

    constructor() {
        this.connect();
    }

    // === public API ===

    ready(): Promise<void> {
        return this.openPromise;
    }

    async subscribe(channel: string): Promise<void> {
        if (!channel) return;
        this.subscriptions.add(channel);
        await this.send({ type: 'SUB', channel });
    }

    async unsubscribe(channel: string): Promise<void> {
        if (!channel) return;
        this.subscriptions.delete(channel);
        await this.send({ type: 'UNSUB', channel });
    }

    ping(): void {
        void this.send({ type: 'PING' });
    }

    onMessage(fn: Listener): () => void {
        this.listeners.push(fn);
        return () => {
            const i = this.listeners.indexOf(fn);
            if (i >= 0) this.listeners.splice(i, 1);
        };
    }

    close(): void {
        this.manualClosed = true;
        this.clearHeartbeat();
        this.ws?.close();
        this.ws = null;
    }

    // === internal ===

    private connect(): void {
        if (this.connecting || this.ws) return;
        this.connecting = true;

        this.openPromise = new Promise<void>((resolve) => {
            this.openResolve = () => resolve();
        });

        console.log('[WS] connecting to', WS_URL);
        const sock = new WebSocket(WS_URL);
        this.ws = sock;

        sock.onopen = () => {
            console.log('[WS] open');
            this.connecting = false;
            this.retry = 0;

            this.openResolve?.();
            this.openResolve = null;

            while (this.queue.length) this._send(this.queue.shift()!);

            if (this.subscriptions.size) {
                this.subscriptions.forEach(ch => this._send({ type: 'SUB', channel: ch }));
            }

            this.startHeartbeat();
        };

        sock.onmessage = (e) => {
            let payload: any = e.data;
            if (typeof payload === 'string') {
                try { payload = JSON.parse(payload); }
                catch {
                    const n = Number(payload);
                    if (!Number.isNaN(n)) payload = n;
                }
            }
            this.listeners.forEach(fn => {
                try { fn(payload); } catch {}
            });
        };

        sock.onerror = (ev) => {
            console.warn('[WS] error', ev);
        };

        sock.onclose = (ev) => {
            console.log('[WS] close', ev.code, ev.reason || '(no reason)');
            this.clearHeartbeat();
            this.ws = null;
            this.connecting = false;

            if (this.manualClosed) return;

            const delay = Math.min(8000, 500 * Math.pow(2, this.retry++));
            window.setTimeout(() => this.connect(), delay);
        };
    }

    private startHeartbeat(): void {
        this.clearHeartbeat();
        this.heartbeatTimer = window.setInterval(() => {
            this._send({ type: 'PING' });
        }, 25000) as unknown as number;
    }

    private clearHeartbeat(): void {
        if (this.heartbeatTimer != null) {
            window.clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private async send(msg: WireMsg): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.queue.push(msg);
            if (!this.connecting && !this.ws) this.connect();
            await this.ready();
            return;
        }
        this._send(msg);
    }

    private _send(msg: WireMsg): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.queue.push(msg);
            if (!this.connecting && !this.ws) this.connect();
            return;
        }
        try {
            this.ws.send(JSON.stringify(msg));
        } catch (e) {
            console.warn('[WS] send failed, buffering', e);
            this.queue.push(msg);
        }
    }
}

export const WsClient = new WSWrapper();
