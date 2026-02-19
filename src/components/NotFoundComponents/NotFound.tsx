
import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import AdminNotFound from './AdminNotFound';
import UserNotFound from './UserNotFound';
import GuestNotFound from './GuestNotFound';

const NotFound: React.FC = () => {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated || !user) {
        return <GuestNotFound />;
    }

    if (user.role === 'admin') {
        return <AdminNotFound />;
    }

    return <UserNotFound />;
};

export default NotFound;
