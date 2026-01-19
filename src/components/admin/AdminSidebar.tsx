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

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

// const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
//   <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
//     <circle cx="12" cy="7" r="4"></circle>
//   </svg>
// );

// const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
//   <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <circle cx="12" cy="12" r="3"></circle>
//     <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
//     <path d="m19 19-2.8-2.8M5 5l2.8 2.8m0 8.4L5 19m14-14-2.8 2.8"></path>
//   </svg>
// );

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
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeItem = 'Dashboard',
  onNavigate,
}) => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { id: 'user-management', label: 'User Management', icon: <UsersIcon />, path: '/admin/user-management' },
    { id: 'vehicle-management', label: 'Vehicle Management', icon: <CarIcon />, path: '/admin/vehicle-management' },
    { id: 'booking-management', label: 'Booking Management', icon: <CalendarIcon />, path: '/admin/bookings' },
    { id: 'payments', label: 'Payments & Subscriptions', icon: <CreditCardIcon />, path: '/admin/payments' },
    { id: 'reports', label: 'Reports & Analytics', icon: <ChartIcon />, path: '/admin/reports' },
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
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-700 flex items-center justify-center text-white text-2xl font-bold">
              R
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">rentNride</h1>
              <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => (
            <MenuItemButton
              key={item.id}
              item={item}
              isActive={activeItem === item.label}
            />
          ))}
        </nav>

        {/* Logout at Bottom */}
        <div className="border-t border-gray-200 py-4">
          {bottomItems.map((item) => (
            <MenuItemButton key={item.id} item={item} isActive={false} />
          ))}
        </div>
      </aside>

      {/* Custom Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Icon + Title */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <LogoutIcon className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Logout</h2>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">
              Are you sure you want to log out of the admin panel? You'll need to sign in again to continue managing the platform.
            </p>

            {/* Buttons */}
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