import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Menu } from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeItem: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeItem }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-gray-50 min-h-screen relative">
            <AdminSidebar
                activeItem={activeItem}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="ml-4 font-bold text-gray-900">rentNride Admin</div>
                </header>

                <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
