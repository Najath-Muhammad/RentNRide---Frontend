import { env } from "../../config/env";
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { X, Loader2, Lock, Wallet, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../../utils/axios";

const stripePromise = loadStripe(env.VITE_STRIPE_PUBLIC_KEY || "pk_test_sample");

// ── Card payment form ─────────────────────────────────────────────────────────
interface CheckoutFormProps {
    bookingId: string;
    amount: number;
    onSuccess: () => void;
    onClose: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ bookingId, amount, onSuccess, onClose }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const createIntent = async () => {
            try {
                const res = await api.post("/payments/advance-payment", { bookingId });
                setClientSecret(res.data.data.clientSecret);
            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                setError(e.response?.data?.message || "Failed to initialize payment");
                setTimeout(onClose, 3000);
            }
        };
        createIntent();
    }, [bookingId, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!stripe || !elements || !clientSecret) return;
        setIsProcessing(true);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement },
        });

        if (stripeError) {
            setError(stripeError.message || "Payment failed");
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "requires_capture") {
            try {
                await api.post("/payments/verify", { bookingId });
            } catch (err) {
                console.error("Failed to verify payment proactively:", err);
            }
            setSuccess("Payment authorized successfully! Escrow hold created.");
            setTimeout(onSuccess, 1500);
        } else {
            setSuccess("Payment authorized successfully!");
            setTimeout(onSuccess, 1500);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}
                </div>
            )}

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 text-sm">Advance Payment Hold</span>
                    <span className="text-lg font-bold text-gray-900">₹{amount.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Held in escrow. Captured only once the ride begins.
                </p>
            </div>

            <div className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
                <CardElement
                    options={{
                        style: {
                            base: { fontSize: "16px", color: "#424770", "::placeholder": { color: "#aab7c4" } },
                            invalid: { color: "#9e2146" },
                        },
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={!stripe || !clientSecret || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
                {isProcessing
                    ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
                    : <><Lock className="w-5 h-5" />Authorize ₹{amount.toLocaleString("en-IN")}</>
                }
            </button>
        </form>
    );
};

// ── Wallet payment panel ──────────────────────────────────────────────────────
interface WalletPanelProps {
    bookingId: string;
    amount: number;
    walletBalance: number;
    onSuccess: () => void;
    onSwitchToCard: () => void;
}

const WalletPanel: React.FC<WalletPanelProps> = ({ bookingId, amount, walletBalance, onSuccess, onSwitchToCard }) => {
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handlePay = async () => {
        setError(null);
        setPaying(true);
        try {
            await api.post("/payments/pay-with-wallet", { bookingId });
            setSuccess("Advance paid from wallet successfully!");
            setTimeout(onSuccess, 1500);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || "Wallet payment failed. Please try again.");
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}
                </div>
            )}

            {/* Balance display */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-emerald-600 mb-0.5">Available Wallet Balance</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{walletBalance.toLocaleString("en-IN")}</p>
                </div>
                <Wallet className="w-8 h-8 text-emerald-500" />
            </div>

            {/* Breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>Advance required</span>
                    <span className="font-semibold text-gray-900">₹{amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Wallet balance</span>
                    <span className="font-semibold text-gray-900">₹{walletBalance.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span>Remaining after payment</span>
                    <span className="text-emerald-700">₹{(walletBalance - amount).toLocaleString("en-IN")}</span>
                </div>
            </div>

            <button
                onClick={handlePay}
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
                {paying
                    ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
                    : <><Wallet className="w-5 h-5" />Pay ₹{amount.toLocaleString("en-IN")} from Wallet</>
                }
            </button>

            <button
                onClick={onSwitchToCard}
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 py-2 transition-colors"
            >
                <CreditCard className="w-4 h-4" />
                Use card instead
            </button>
        </div>
    );
};

// ── Main Modal ────────────────────────────────────────────────────────────────
interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    amount: number;
    onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, bookingId, amount, onSuccess }) => {
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [loadingWallet, setLoadingWallet] = useState(true);
    // "wallet" tab only shown if sufficient; default depends on balance
    const [tab, setTab] = useState<"wallet" | "card">("card");

    useEffect(() => {
        if (!isOpen) return;
        setLoadingWallet(true);
        api.get("/wallet")
            .then((res) => {
                const balance = res.data.data.balance ?? 0;
                setWalletBalance(balance);
                // Auto-select wallet tab if balance is sufficient
                if (balance >= amount) setTab("wallet");
                else setTab("card");
            })
            .catch(() => {
                setWalletBalance(0);
                setTab("card");
            })
            .finally(() => setLoadingWallet(false));
    }, [isOpen, amount]);

    if (!isOpen) return null;

    const hasSufficientWallet = walletBalance !== null && walletBalance >= amount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">Advance Payment</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {loadingWallet ? "Checking wallet balance..." : hasSufficientWallet ? "Pay from wallet or card" : "Pay with card"}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5">
                    {loadingWallet ? (
                        <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm">Checking wallet balance…</span>
                        </div>
                    ) : (
                        <>
                            {/* Tab bar — only show if wallet has enough balance */}
                            {hasSufficientWallet && (
                                <div className="flex gap-2 mb-5">
                                    <button
                                        onClick={() => setTab("wallet")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${tab === "wallet" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                                    >
                                        <Wallet className="w-4 h-4" />Wallet
                                    </button>
                                    <button
                                        onClick={() => setTab("card")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${tab === "card" ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                                    >
                                        <CreditCard className="w-4 h-4" />Card
                                    </button>
                                </div>
                            )}

                            {tab === "wallet" && hasSufficientWallet ? (
                                <WalletPanel
                                    bookingId={bookingId}
                                    amount={amount}
                                    walletBalance={walletBalance!}
                                    onSuccess={onSuccess}
                                    onSwitchToCard={() => setTab("card")}
                                />
                            ) : (
                                <Elements stripe={stripePromise}>
                                    <CheckoutForm bookingId={bookingId} amount={amount} onSuccess={onSuccess} onClose={onClose} />
                                </Elements>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
