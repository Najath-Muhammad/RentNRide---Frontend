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
                const error = err as { response?: { data?: { message?: string } } };
                setError(error.response?.data?.message || "Failed to initialize payment");
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
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}</div>}

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
                {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
                ) : (
                    <><Lock className="w-5 h-5" />Authorize ₹{amount.toLocaleString("en-IN")}</>
                )}
            </button>
        </form>
    );
};

// ── Wallet payment form ───────────────────────────────────────────────────────
interface WalletFormProps {
    bookingId: string;
    amount: number;
    onSuccess: () => void;
}

const WalletForm: React.FC<WalletFormProps> = ({ bookingId, amount, onSuccess }) => {
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        api.get("/wallet")
            .then((res) => setWalletBalance(res.data.data.balance ?? 0))
            .catch(() => setWalletBalance(0))
            .finally(() => setLoading(false));
    }, []);

    const hasSufficientBalance = walletBalance !== null && walletBalance >= amount;

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
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}</div>}

            {/* Balance card */}
            <div className={`p-4 rounded-xl border-2 ${hasSufficientBalance ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Wallet Balance</p>
                        {loading ? (
                            <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /><span className="text-sm text-gray-400">Loading...</span></div>
                        ) : (
                            <p className={`text-2xl font-bold ${hasSufficientBalance ? "text-green-700" : "text-red-600"}`}>
                                ₹{walletBalance?.toLocaleString("en-IN")}
                            </p>
                        )}
                    </div>
                    <Wallet className={`w-8 h-8 ${hasSufficientBalance ? "text-green-500" : "text-red-400"}`} />
                </div>
            </div>

            {/* Amount breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>Advance required</span>
                    <span className="font-semibold text-gray-900">₹{amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Wallet balance</span>
                    <span className="font-semibold text-gray-900">₹{walletBalance?.toLocaleString("en-IN") ?? "—"}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span>Remaining after payment</span>
                    <span className={hasSufficientBalance ? "text-green-700" : "text-red-600"}>
                        {walletBalance !== null ? `₹${(walletBalance - amount).toLocaleString("en-IN")}` : "—"}
                    </span>
                </div>
            </div>

            {!hasSufficientBalance && !loading && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Insufficient wallet balance. Please top up your wallet or pay with a card.
                </p>
            )}

            <button
                onClick={handlePay}
                disabled={paying || !hasSufficientBalance || loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
                {paying ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
                ) : (
                    <><Wallet className="w-5 h-5" />Pay ₹{amount.toLocaleString("en-IN")} from Wallet</>
                )}
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
    const [tab, setTab] = useState<"wallet" | "card">("wallet");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">Advance Payment</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Choose your payment method</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab selector */}
                <div className="flex gap-2 p-4 pb-0">
                    <button
                        onClick={() => setTab("wallet")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${tab === "wallet" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    >
                        <Wallet className="w-4 h-4" /> Wallet
                    </button>
                    <button
                        onClick={() => setTab("card")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${tab === "card" ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    >
                        <CreditCard className="w-4 h-4" /> Card
                    </button>
                </div>

                {/* Tab content */}
                <div className="p-5">
                    {tab === "wallet" ? (
                        <WalletForm bookingId={bookingId} amount={amount} onSuccess={onSuccess} />
                    ) : (
                        <Elements stripe={stripePromise}>
                            <CheckoutForm bookingId={bookingId} amount={amount} onSuccess={onSuccess} onClose={onClose} />
                        </Elements>
                    )}
                </div>
            </div>
        </div>
    );
};
