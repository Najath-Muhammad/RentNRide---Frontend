import React, { useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    isLoading = false,
}) => {
    const cancelButtonRef = useRef(null);

    if (!isOpen) return null;

    const getButtonColor = () => {
        switch (type) {
            case 'danger':
                return 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 focus:ring-red-500';
            case 'warning':
                return 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500';
            default:
                return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-50 text-red-500';
            case 'warning':
                return 'bg-orange-50 text-orange-500';
            default:
                return 'bg-blue-50 text-blue-500';
        }
    };

    const getTopBorder = () => {
        switch (type) {
            case 'danger':
                return 'bg-gradient-to-r from-red-400 via-red-500 to-rose-500';
            case 'warning':
                return 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600';
            default:
                return 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600';
        }
    };

    return (
        <div className="fixed inset-0 z-[90] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    aria-hidden="true"
                    onClick={isLoading ? undefined : onClose}
                />

                {/* Modal panel */}
                <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
                    {/* Gradient top border */}
                    <div className={`h-2 ${getTopBorder()}`} />

                    <div className="p-8">
                        <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full ${getIconColor()}`}>
                                <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2" id="modal-title">
                                    {title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pb-8 flex gap-3">
                        <button
                            type="button"
                            className="flex-1 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={onClose}
                            ref={cancelButtonRef}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${getButtonColor()}`}
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                            {isLoading ? 'Processing...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
