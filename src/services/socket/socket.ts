import { env } from "../../config/env";
import { io, Socket } from 'socket.io-client';
import { getSessionToken } from '../../utils/axios';

const SOCKET_URL = env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: (cb) => {
                // Pass the Bearer token for cross-domain socket auth
                const token = getSessionToken();
                cb({ token: token ?? undefined });
            },
        });
    }
    return socket;
}

export function connectSocket(): Socket {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
    }
    return s;
}

export function disconnectSocket(): void {
    if (socket?.connected) {
        socket.disconnect()
    }
}
