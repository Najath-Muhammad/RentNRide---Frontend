import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/authStore';
import { LoginApi } from '../../services/api/admin/login.api';


const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const CarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
    <circle cx="7" cy="17" r="2"></circle>
    <path d="M9 17h6"></path>
    <circle cx="17" cy="17" r="2"></circle>
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
);

const CategoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line x1="7" y1="7" x2="7.01" y2="7"></line>
  </svg>
);

const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface AdminSidebarProps {
  activeItem?: string;
  onNavigate?: (item: MenuItem) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeItem = 'Dashboard',
  onNavigate,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { id: 'user-management', label: 'User Management', icon: <UsersIcon />, path: '/admin/user-management' },
    { id: 'category-management', label: 'Category Management', icon: <CategoryIcon />, path: '/admin/category-management' },
    { id: 'vehicle-management', label: 'Vehicle Management', icon: <CarIcon />, path: '/admin/vehicle-management' },
    { id: 'booking-management', label: 'Booking Management', icon: <CalendarIcon />, path: '/admin/bookings' },
    { id: 'payments', label: 'Payments & Subscriptions', icon: <CreditCardIcon />, path: '/admin/subscription-management/' },
  ];

  const bottomItems: MenuItem[] = [
    { id: 'logout', label: 'Logout', icon: <LogoutIcon className="text-red-600" />, path: '/logout' },
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.id === 'logout') {
      setIsLogoutModalOpen(true);
      return;
    }
    navigate({ to: item.path });
    onNavigate?.(item);
    if (onClose) onClose();
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await LoginApi.logout();
      setUser(null);

      navigate({ to: '/auth/admin-login' });
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      navigate({ to: '/auth/admin-login' });
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      if (onClose) onClose();
    }
  };

  const MenuItemButton: React.FC<{ item: MenuItem; isActive: boolean }> = ({ item, isActive }) => {
    const isLogout = item.id === 'logout';

    return (
      <button
        onClick={() => handleItemClick(item)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${isActive
          ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600 font-medium'
          : isLogout
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
          }`}
      >
        <span className={isActive ? 'text-teal-600' : isLogout ? 'text-red-600' : 'text-gray-500'}>
          {item.icon}
        </span>
        <span className="text-sm font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      {}
      <aside className={`w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white text-xl font-bold">
              R
            </div>
            <div>
              <h1 className="font-bold text-base text-gray-900 leading-none">rentNride</h1>
              <p className="text-[10px] text-gray-500 font-medium mt-1">Admin Panel</p>
            </div>
          </div>
          {}
          <button className="lg:hidden p-2 text-gray-400 hover:text-gray-600" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => (
            <MenuItemButton
              key={item.id}
              item={item}
              isActive={activeItem === item.label}
            />
          ))}
        </nav>

        {}
        <div className="border-t border-gray-200 py-4">
          {bottomItems.map((item) => (
            <MenuItemButton key={item.id} item={item} isActive={false} />
          ))}
        </div>
      </aside>
      {}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <LogoutIcon className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Logout</h2>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">
              Are you sure you want to log out of the admin panel? You'll need to sign in again to continue managing the platform.
            </p>

            {}
            <div className="flex gap-3 justify-end mt-8">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={isLoggingOut}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isLoggingOut && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isLoggingOut ? 'Logging out...' : 'Yes, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};