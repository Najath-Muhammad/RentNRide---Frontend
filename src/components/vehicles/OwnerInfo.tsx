import React, { useState } from 'react';
import { User, MessageCircle, Star } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/authStore';
import { ChatApi } from '../../services/api/chat/chat.api';

interface Owner {
    _id: string;
    name: string;
    email: string;
    mobileNumber?: string;
    profileImage?: string;
}

interface OwnerInfoProps {
    owner: Owner;
}

const OwnerInfo: React.FC<OwnerInfoProps> = ({ owner }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleChatClick = async () => {
        if (!isAuthenticated || !user) {
            navigate({ to: '/auth/login' });
            return;
        }

        if (user._id === owner._id) {
            // Cannot chat with yourself
            return;
        }

        setIsLoading(true);
        try {
            // Initiate chat
            const response = await ChatApi.getOrCreateConversation(owner._id);
            if (response.success && response.data) {
                navigate({ to: '/user/chat', search: { conversationId: response.data._id } as never });
            }
        } catch (error) {
            console.error("Failed to start chat", error);
            // Optionally handle error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg p-8 shadow mb-8">
            <h2 className="text-2xl font-bold mb-6">Hosted by</h2>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                        {owner.profileImage ? (
                            <img src={owner.profileImage} alt={owner.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-8 h-8 text-blue-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{owner.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center text-sm text-gray-600">
                                <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                                5.0 (Host Rating)
                            </span>
                        </div>
                    </div>
                </div>

                {user?._id !== owner._id && (
                    <button
                        onClick={handleChatClick}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <MessageCircle className="w-5 h-5" />
                        {isLoading ? 'Starting Chat...' : 'Chat with Host'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default OwnerInfo;
