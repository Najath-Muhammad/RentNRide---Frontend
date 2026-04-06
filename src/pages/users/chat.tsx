import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
    AlertCircle,
    Check,
    CheckCheck,
    ChevronLeft,
    Loader2,
    MessageCircle,
    Send,
    X,
} from 'lucide-react';
import Navbar from '../../components/user/Navbar';
import { api } from '../../utils/axios';
import { PaymentModal } from '../../components/common/PaymentModal';
import { ChatApi, type Conversation, type Message } from '../../services/api/chat/chat.api';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socket/socket';
import { useAuthStore } from '../../stores/authStore';

const ChatPage: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageText, setMessageText] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [actionModal, setActionModal] = useState<{ isOpen: boolean; bookingId: string; action: 'approved' | 'rejected' } | null>(null);
    const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; bookingId: string; amount: number } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Scroll to bottom ─────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // ── Socket setup ─────────────────────────────────────────────────────
    useEffect(() => {
        const socket = connectSocket();

        socket.on('message:new', (msg: Message) => {
            setMessages((prev) => {
                const exists = prev.some((m) => m._id === msg._id);
                return exists ? prev : [...prev, msg];
            });
            setConversations((prev) =>
                prev.map((c) =>
                    c._id === msg.conversationId
                        ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt }
                        : c
                )
            );
            setTimeout(scrollToBottom, 100);
        });

        socket.on('booking:updated', (data: { bookingId: string; action: string }) => {
            console.log('[Chat] Booking updated:', data);
        });

        socket.on('typing:start', (data: { userId: string }) => {
            setTypingUsers((prev) => new Set([...prev, data.userId]));
        });

        socket.on('typing:stop', (data: { userId: string }) => {
            setTypingUsers((prev) => {
                const next = new Set(prev);
                next.delete(data.userId);
                return next;
            });
        });

        socket.on('user:online', (data: { userId: string }) => {
            setOnlineUsers((prev) => new Set([...prev, data.userId]));
        });

        socket.on('user:offline', (data: { userId: string }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(data.userId);
                return next;
            });
        });

        return () => {
            socket.off('message:new');
            socket.off('booking:updated');
            socket.off('typing:start');
            socket.off('typing:stop');
            socket.off('user:online');
            socket.off('user:offline');
            disconnectSocket();
        };
    }, [scrollToBottom]);

    // ── Load conversations ────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                setLoadingConversations(true);
                const res = await ChatApi.getConversations();
                if (res.success) setConversations(res.data);
            } catch (e) {
                console.error('Failed to load conversations:', e);
            } finally {
                setLoadingConversations(false);
            }
        })();
    }, []);

    // ── Open a conversation ───────────────────────────────────────────────
    const openConversation = async (conversation: Conversation) => {
        setActiveConversation(conversation);
        setLoadingMessages(true);
        setMessages([]);

        // Mark as read in local state
        setConversations((prev) =>
            prev.map((c) =>
                c._id === conversation._id && c.lastMessage
                    ? { ...c, lastMessage: { ...c.lastMessage, isRead: true } }
                    : c
            )
        );

        try {
            const socket = getSocket();
            socket.emit('conversation:join', conversation._id);

            const res = await ChatApi.getMessages(conversation._id);
            if (res.success) {
                setMessages(res.data.data);
                setTimeout(scrollToBottom, 100);
            }
        } catch (e) {
            console.error('Failed to load messages:', e);
        } finally {
            setLoadingMessages(false);
        }
    };

    // ── Send message ──────────────────────────────────────────────────────
    const handleSendMessage = async () => {
        if (!messageText.trim() || !activeConversation || !user || sending) return;

        const otherParticipant = activeConversation.participants.find(
            (p) => p._id !== user.id
        );
        if (!otherParticipant) return;

        const text = messageText.trim();
        setMessageText('');
        setSending(true);

        try {
            const socket = getSocket();
            socket.emit('message:send', {
                conversationId: activeConversation._id,
                receiverId: otherParticipant._id,
                content: text,
                messageType: 'text',
            });
        } catch (e) {
            console.error('Failed to send message:', e);
            setMessageText(text);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    // ── Approve / Reject booking ──────────────────────────────────────────
    const handleBookingActionClick = (bookingId: string, action: 'approved' | 'rejected') => {
        setActionModal({ isOpen: true, bookingId, action });
    };

    const confirmBookingAction = async () => {
        if (!activeConversation || !actionModal) return;

        try {
            const socket = getSocket();
            socket.emit('booking:action', {
                conversationId: activeConversation._id,
                bookingId: actionModal.bookingId,
                action: actionModal.action,
            });
        } catch (e) {
            console.error('Booking action failed:', e);
        } finally {
            setActionModal(null);
        }
    };

    // ── Confirm Vehicle Reached (Release Escrow) ──────────────────────────
    const handleVehicleReached = async (bookingId: string) => {
        try {
            await api.post('/payments/capture', { bookingId });
            // Refresh conversation to get updated status
            if (activeConversation) openConversation(activeConversation);
        } catch (error) {
            console.error('Failed to confirm vehicle reached:', error);
            alert('Failed to confirm vehicle reached. Please try again.');
        }
    };

    // ── Typing indicator ──────────────────────────────────────────────────
    const handleTyping = (text: string) => {
        setMessageText(text);

        if (!activeConversation || !user) return;
        const otherParticipant = activeConversation.participants.find(
            (p) => p._id !== user.id
        );
        if (!otherParticipant) return;

        const socket = getSocket();
        socket.emit('typing:start', {
            conversationId: activeConversation._id,
            receiverId: otherParticipant._id,
        });

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socket.emit('typing:stop', {
                conversationId: activeConversation._id,
                receiverId: otherParticipant._id,
            });
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────
    const getOtherParticipant = (conv: Conversation) =>
        conv.participants.find((p) => p._id !== user?.id);

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const isOwnMessage = (msg: Message) => msg.senderId._id === user?.id;

    const isOwnerInConversation = (conv: Conversation | null) => {
        if (!conv || !user) return false;
        // The owner is the non-current-user who owns the vehicle (simple heuristic — they have the vehicle in conv)
        // For action rendering: show approve/reject buttons only on booking_request messages if current user is NOT the sender
        return true;
    };

    // ── Group messages by date ────────────────────────────────────────────
    const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>(
        (acc, msg) => {
            const dateKey = new Date(msg.createdAt).toDateString();
            const last = acc[acc.length - 1];
            if (last && last.date === dateKey) {
                last.msgs.push(msg);
            } else {
                acc.push({ date: dateKey, msgs: [msg] });
            }
            return acc;
        },
        []
    );

    const actedBookingIds = new Set(
        messages
            .filter((m) => m.messageType === 'booking_action' && m.bookingId)
            .map((m) => m.bookingId!._id || (m.bookingId as unknown as string))
    );

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-4 h-[calc(100vh-80px)]">
                {/* ── Conversation List ─────────────────────────────────── */}
                <aside
                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300
                        ${activeConversation ? 'hidden md:flex md:w-80 lg:w-96' : 'flex w-full md:w-80 lg:w-96'}`}
                >
                    <div className="p-5 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingConversations ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 text-blue-500" />
                                </div>
                                <p className="text-gray-700 font-semibold">No conversations yet</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    Book a vehicle to start chatting with the owner
                                </p>
                                <button
                                    onClick={() => navigate({ to: '/vehicles/search' })}
                                    className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    Browse Vehicles
                                </button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {conversations.map((conv) => {
                                    const other = getOtherParticipant(conv);
                                    const isActive = activeConversation?._id === conv._id;
                                    const isOnline = other ? onlineUsers.has(other._id) : false;

                                    const lastMsgSenderId = typeof conv.lastMessage?.senderId === 'object'
                                        ? conv.lastMessage.senderId._id
                                        : conv.lastMessage?.senderId;
                                    const isUnread = conv.lastMessage && !conv.lastMessage.isRead && lastMsgSenderId !== user?.id;

                                    return (
                                        <li
                                            key={conv._id}
                                            onClick={() => openConversation(conv)}
                                            className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 relative
                                                ${isActive
                                                    ? 'bg-blue-50 border-l-2 border-blue-600'
                                                    : isUnread
                                                        ? 'bg-blue-50/30 border-l-2 border-blue-400 hover:bg-gray-50'
                                                        : 'hover:bg-gray-50 border-l-2 border-transparent'}`}
                                        >
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {other?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                {isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <p className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                                                        {other?.name || 'Unknown'}
                                                    </p>
                                                    {conv.lastMessageAt && (
                                                        <span className={`text-xs ml-1 flex-shrink-0 ${isUnread ? 'font-bold text-blue-600' : 'text-gray-400'}`}>
                                                            {formatTime(conv.lastMessageAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center mt-0.5">
                                                    <p className={`text-xs truncate ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                                                        {conv.lastMessage?.content || 'No messages yet'}
                                                    </p>
                                                    {isUnread && (
                                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ml-2 flex-shrink-0"></span>
                                                    )}
                                                </div>
                                                {conv.vehicleId && (
                                                    <p className="text-xs text-blue-500 font-medium truncate mt-0.5">
                                                        🚗 {conv.vehicleId.brand} {conv.vehicleId.modelName}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </aside>

                {/* ── Chat Window ───────────────────────────────────────── */}
                <main
                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300
                        ${activeConversation ? 'flex flex-1' : 'hidden md:flex flex-1'}`}
                >
                    {!activeConversation ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-6">
                                <MessageCircle className="w-12 h-12 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Inbox</h3>
                            <p className="text-gray-500 max-w-xs">
                                Select a conversation from the list to start chatting with your renter or vehicle owner.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>

                                {(() => {
                                    const other = getOtherParticipant(activeConversation);
                                    const isOnline = other ? onlineUsers.has(other._id) : false;
                                    const isTypingNow = other ? typingUsers.has(other._id) : false;

                                    return (
                                        <>
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {other?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                {isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{other?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {isTypingNow ? (
                                                        <span className="text-blue-500 font-medium">typing...</span>
                                                    ) : isOnline ? (
                                                        <span className="text-green-500">Online</span>
                                                    ) : (
                                                        'Offline'
                                                    )}
                                                </p>
                                            </div>
                                            {activeConversation.vehicleId && (
                                                <div className="ml-auto text-right">
                                                    <p className="text-xs text-gray-400 font-medium">Vehicle</p>
                                                    <p className="text-sm font-semibold text-blue-600">
                                                        {activeConversation.vehicleId.brand} {activeConversation.vehicleId.modelName}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <p className="text-gray-400 text-sm">No messages yet. Say hello! 👋</p>
                                    </div>
                                ) : (
                                    groupedMessages.map(({ date, msgs }) => (
                                        <div key={date}>
                                            {/* Date divider */}
                                            <div className="flex items-center gap-3 my-4">
                                                <div className="flex-1 h-px bg-gray-100" />
                                                <span className="text-xs text-gray-400 font-medium px-2">
                                                    {formatDate(msgs[0].createdAt)}
                                                </span>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>

                                            {msgs.map((msg) => {
                                                const own = isOwnMessage(msg);

                                                return (
                                                    <div
                                                        key={msg._id}
                                                        className={`flex mb-2 ${own ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div className={`max-w-[75%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                                                            {/* Booking Request Card */}
                                                            {msg.messageType === 'booking_request' && (
                                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-1 w-full">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                                                                            <span className="text-white text-xs font-bold">🚗</span>
                                                                        </div>
                                                                        <p className="font-bold text-blue-800 text-sm">Rent Request</p>
                                                                    </div>
                                                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>

                                                                    {/* Approve/Reject buttons — show to non-sender only */}
                                                                    {(() => {
                                                                        const isExpired = msg.bookingId?.startDate ? new Date(msg.bookingId.startDate) < new Date() : false;
                                                                        const hasActed = actedBookingIds.has(msg.bookingId?._id || (msg.bookingId as unknown as string));
                                                                        const showActions = !own && isOwnerInConversation(activeConversation) && msg.bookingId && !hasActed && !isExpired;

                                                                        return (
                                                                            <div className="mt-3">
                                                                                {isExpired && !hasActed && (
                                                                                    <div className="bg-gray-100 border border-gray-200 rounded-xl py-2 px-3 text-center">
                                                                                        <p className="text-sm font-semibold text-gray-500">Expired Request</p>
                                                                                    </div>
                                                                                )}
                                                                                {showActions && (
                                                                                    <div className="flex gap-2">
                                                                                        <button
                                                                                            onClick={() => handleBookingActionClick(
                                                                                                msg.bookingId!._id || (msg.bookingId as unknown as string),
                                                                                                'approved'
                                                                                            )}
                                                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                                                                                        >
                                                                                            <Check className="w-4 h-4" />
                                                                                            Approve
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleBookingActionClick(
                                                                                                msg.bookingId!._id || (msg.bookingId as unknown as string),
                                                                                                'rejected'
                                                                                            )}
                                                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                                                                                        >
                                                                                            <X className="w-4 h-4" />
                                                                                            Reject
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            )}

                                                            {/* Booking Action Card */}
                                                            {msg.messageType === 'booking_action' && (
                                                                <div className="flex flex-col gap-2 w-full">
                                                                    <div className={`border rounded-2xl p-3 mb-1 w-full flex items-center gap-3
                                                                        ${msg.bookingAction === 'approved'
                                                                            ? 'bg-green-50 border-green-200'
                                                                            : 'bg-red-50 border-red-200'}`}
                                                                    >
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                                                            ${msg.bookingAction === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}
                                                                        >
                                                                            {msg.bookingAction === 'approved'
                                                                                ? <Check className="w-4 h-4 text-green-600" />
                                                                                : <AlertCircle className="w-4 h-4 text-red-600" />
                                                                            }
                                                                        </div>
                                                                        <p className={`text-sm font-semibold
                                                                            ${msg.bookingAction === 'approved' ? 'text-green-800' : 'text-red-800'}`}
                                                                        >
                                                                            {msg.content}
                                                                        </p>
                                                                    </div>
                                                                    {/* Show Pay Advance button if it's approved and the renter is viewing */}
                                                                    {!own && msg.bookingAction === 'approved' && msg.bookingId?.bookingStatus === 'approved' && (
                                                                        <button
                                                                            onClick={() => setPaymentModal({ isOpen: true, bookingId: msg.bookingId!._id || (msg.bookingId as unknown as string), amount: msg.bookingId?.advancePaid || 0 })}
                                                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                                                                        >
                                                                            Pay Advance {msg.bookingId?.advancePaid ? `₹${msg.bookingId.advancePaid.toLocaleString("en-IN")}` : ''}
                                                                        </button>
                                                                    )}
                                                                    {/* Show Confirm Vehicle button if advance paid and the renter is viewing */}
                                                                    {!own && msg.bookingAction === 'approved' && msg.bookingId?.bookingStatus === 'advance_authorized' && (
                                                                        <button
                                                                            onClick={() => handleVehicleReached(msg.bookingId!._id || (msg.bookingId as unknown as string))}
                                                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                                                                        >
                                                                            <CheckCheck className="w-5 h-5" />
                                                                            Confirm Vehicle Reached
                                                                        </button>
                                                                    )}
                                                                    {/* Info indicator if payment was captured */}
                                                                    {msg.bookingAction === 'approved' && ['ride_started', 'payment_captured'].includes(msg.bookingId?.bookingStatus || '') && (
                                                                        <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-100 text-green-800 text-sm font-semibold rounded-xl border border-green-200 shadow-sm mt-1">
                                                                            <CheckCheck className="w-4 h-4 text-green-600" />
                                                                            {own ? "Advance payment confirmed & captured" : "Vehicle reached & payment confirmed"}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Regular text bubble */}
                                                            {msg.messageType === 'text' && (
                                                                <div
                                                                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                                                        ${own
                                                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                                                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}
                                                                >
                                                                    {msg.content}
                                                                </div>
                                                            )}

                                                            {/* Timestamp + read status */}
                                                            <div className={`flex items-center gap-1 mt-0.5 ${own ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                                                                {own && (
                                                                    msg.isRead
                                                                        ? <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                                                                        : <Check className="w-3.5 h-3.5 text-gray-300" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="px-4 py-3 border-t border-gray-100 bg-white">
                                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => handleTyping(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message…"
                                        className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                                        disabled={sending}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!messageText.trim() || sending}
                                        className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                                    >
                                        {sending
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Send className="w-4 h-4" />
                                        }
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Confirmation Modal */}
            {actionModal && actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${actionModal.action === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {actionModal.action === 'approved' ? (
                                    <Check className={`w-8 h-8 text-green-600`} />
                                ) : (
                                    <X className={`w-8 h-8 text-red-600`} />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Confirm {actionModal.action === 'approved' ? 'Approval' : 'Rejection'}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to {actionModal.action === 'approved' ? 'approve' : 'reject'} this rent request? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setActionModal(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmBookingAction}
                                    className={`flex-1 px-4 py-2 text-white font-semibold rounded-xl transition-colors ${actionModal.action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    Yes, {actionModal.action === 'approved' ? 'Approve' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {paymentModal && paymentModal.isOpen && (
                <PaymentModal
                    isOpen={paymentModal.isOpen}
                    onClose={() => setPaymentModal(null)}
                    bookingId={paymentModal.bookingId}
                    amount={paymentModal.amount}
                    onSuccess={() => {
                        setPaymentModal(null);
                        if (activeConversation) {
                            openConversation(activeConversation);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ChatPage;
