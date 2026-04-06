import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/user/Navbar';
import { WalletApi, type Wallet } from '../../services/api/wallet/wallet.api';
import { WalletFundingModal } from '../../components/common/WalletFundingModal';
import { Wallet as WalletIcon, PlusCircle, ArrowUpRight, ArrowDownLeft, Loader2, Calendar } from 'lucide-react';

const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return "just now";
};

const WalletPage: React.FC = () => {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [fundingAmount, setFundingAmount] = useState<number>(500);

    const loadWalletData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await WalletApi.getWallet();
            if (res.success) {
                setWallet(res.data);
            }
        } catch (err) {
            console.error('Failed to load wallet', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWalletData();
    }, [loadWalletData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                        <p className="text-gray-500 font-medium animate-pulse">Loading wallet details...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left Column: Wallet Card */}
                    <div className="w-full md:w-1/3 space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                            {/* Decorative background circle */}
                            <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-50 rounded-full blur-2xl"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                            <WalletIcon size={28} className="stroke-[2.5]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Available Balance</h3>
                                </div>
                                <div className="mb-8">
                                    <h1 className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline gap-1">
                                        <span className="text-2xl text-gray-400">₹</span>
                                        {wallet?.balance.toLocaleString("en-IN") || '0'}
                                    </h1>
                                </div>

                                <div className="mb-6 border-t border-gray-100 pt-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Quick Fund</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[500, 1000, 2000, 5000].map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => setFundingAmount(amt)}
                                                className={`px-3 py-2 rounded-xl text-sm font-bold transition flex-1 min-w-[70px] ${fundingAmount === amt
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                                            >
                                                ₹{amt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowWalletModal(true)}
                                    className="w-full bg-gray-900 text-white rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 hover:bg-black transition font-bold shadow-lg"
                                >
                                    <PlusCircle size={18} className="stroke-[2.5]" />
                                    Add ₹{fundingAmount}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Transaction History */}
                    <div className="flex-1 w-full">
                        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                                <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                                    <Calendar size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
                            </div>

                            <div className="p-8">
                                {!wallet?.transactionHistory || wallet.transactionHistory.length === 0 ? (
                                    <div className="text-center py-12 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <WalletIcon className="w-8 h-8 text-gray-300 stroke-[1.5]" />
                                        </div>
                                        <p className="text-gray-500 font-medium">No transactions yet.</p>
                                        <p className="text-gray-400 text-sm mt-1">Your wallet activity will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {[...wallet.transactionHistory].reverse().map((tx) => (
                                            <div key={tx._id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.transactionType === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {tx.transactionType === 'credit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 leading-tight mb-1">{tx.description}</p>
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                            {new Date(tx.date).toLocaleDateString()} • {timeAgo(tx.date)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className={`text-lg font-bold ${tx.transactionType === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                                        {tx.transactionType === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString("en-IN")}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <WalletFundingModal
                isOpen={showWalletModal}
                onClose={() => setShowWalletModal(false)}
                amount={fundingAmount}
                onSuccess={() => {
                    setShowWalletModal(false);
                    loadWalletData();
                }}
            />
        </div>
    );
};

export default WalletPage;
