import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, ChevronRight } from 'lucide-react';
import { ChatbotApi } from '../../services/api/chatbot/chatbot.api';
import { Link, useRouterState } from '@tanstack/react-router';

// Routes where the chatbot should NOT appear
const HIDDEN_ON_ROUTES = ['/auth', '/admin'];

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    vehicles?: any[];
}

export const ChatbotWidget: React.FC = () => {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const isHidden = HIDDEN_ON_ROUTES.some((route) => pathname.startsWith(route));

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'bot',
            text: 'Hi there! I am your RentNride AI assistant. How can I help you find a vehicle today? Try saying "I need a bike in Kochi under 500".'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: inputValue.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await ChatbotApi.searchVehiclesViaChat(userMsg.text);
            const { intent, reply, vehicles, total } = response.data;

            let botResponseText = '';
            let botVehicles: any[] | undefined;

            if (intent === 'chat') {
                // Normal conversation — just show the AI reply
                botResponseText = reply || "I'm here to help you find vehicles! Try: \"I need an SUV in Kochi under ₹2000\".";
            } else {
                // Vehicle search result
                if (vehicles && vehicles.length > 0) {
                    botResponseText = `I found ${total} vehicle(s) matching your criteria! Here are the top results:`;
                    botVehicles = vehicles.slice(0, 3);
                } else {
                    botResponseText = "I couldn't find any vehicles matching your criteria. Try adjusting your search!";
                }
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: botResponseText,
                vehicles: botVehicles,
            };

            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: 'Sorry, I am having trouble connecting to my AI brain right now. Please try again later.'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (isHidden) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:scale-105 transition-all text-white"
                >
                    <MessageSquare className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white w-[350px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-6rem)] rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">RentNride AI</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.sender === 'bot' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {msg.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </div>

                                {/* Message Bubble */}
                                <div className={`max-w-[75%] flex flex-col gap-2`}>
                                    <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-sm'
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                                        }`}>
                                        {msg.text}
                                    </div>

                                    {/* Vehicle Cards Payload */}
                                    {msg.vehicles && msg.vehicles.length > 0 && (
                                        <div className="flex flex-col gap-2 mt-1 w-64 max-w-full">
                                            {msg.vehicles.map((v, i) => (
                                                <Link key={i} to="/vehicles/$id" params={{ id: v._id }} className="block bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition cursor-pointer">
                                                    <div className="flex items-start gap-3">
                                                        <img
                                                            src={v.vehicleImages?.[0] || 'https://via.placeholder.com/150'}
                                                            alt={`${v.brand} ${v.modelName}`}
                                                            className="w-16 h-16 rounded-lg object-cover bg-gray-100 border border-gray-100"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-gray-900 text-sm truncate">{v.brand} {v.modelName}</h4>
                                                            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mt-0.5">
                                                                {typeof v.category === 'object' && v.category ? v.category.name : v.category || 'Standard'}
                                                            </p>
                                                            <div className="flex items-center justify-between mt-1.5">
                                                                <span className="font-extrabold text-gray-900 text-sm">₹{v.pricePerDay}</span>
                                                                <span className="text-[10px] text-gray-500 truncate max-w-[60px]">{v.pickupAddress || 'India'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                            {msg.vehicles.length >= 3 && (
                                                <button className="text-xs text-indigo-600 font-semibold p-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition flex items-center justify-center gap-1 group w-full">
                                                    See more filters
                                                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-end gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm p-4 w-16 flex items-center justify-center gap-1 shadow-sm">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <form onSubmit={handleSendMessage} className="relative flex items-center">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-medium"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center justify-center shadow-sm"
                            >
                                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />}
                            </button>
                        </form>
                        <div className="mt-2 text-center">
                            <span className="text-[10px] text-gray-400 font-medium">✨ Powered by Llama 3 LLM</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
