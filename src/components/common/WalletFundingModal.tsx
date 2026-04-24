import { env } from "../../config/env";
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { X, Loader2, Lock } from "lucide-react";
import { WalletApi } from "../../services/api/wallet/wallet.api";
import { api } from "../../utils/axios";

// Ensure VITE_STRIPE_PUBLIC_KEY is correctly set in .env
const stripePromise = loadStripe(env.VITE_STRIPE_PUBLIC_KEY || "pk_test_sample");

interface CheckoutFormProps {
    amount: number;
    onSuccess: () => void;
    onClose: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ amount, onSuccess, onClose }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string>("");

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const createIntent = async () => {
            try {
                const res = await WalletApi.createFundingIntent(amount);
                setClientSecret(res.data.clientSecret);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } } }; setError(error.response?.data?.message || "Failed to initialize payment");
                setTimeout(onClose, 3000);
            }
        };
        createIntent();
    }, [amount, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!stripe || !elements || !clientSecret) return;

        setIsProcessing(true);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        if (stripeError) {
            setError(stripeError.message || "Payment failed");
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            try {
                // Verify proactively because webhooks aren't running locally by default
                await api.post("/wallet/verify-funding", { paymentIntentId: paymentIntent.id });
            } catch (err) {
                console.error("Failed to verify wallet funding via api, banking on webhook", err);
            }
            setSuccess("Wallet funded successfully!");
            setTimeout(onSuccess, 1500);
        } else {
            setSuccess("Payment authorized successfully!");
            setTimeout(onSuccess, 1500);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-200">{success}</div>}

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 text-sm">Amount to add</span>
                    <span className="text-lg font-bold text-gray-900">₹{amount.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                    This securely tops up your wallet using Stripe. The balance can be used for your rentals.
                </p>
            </div>

            <div className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={!stripe || !clientSecret || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors mt-2"
            >
                {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                    <><Lock className="w-5 h-5" /> Add ₹{amount.toLocaleString("en-IN")}</>
                )}
            </button>
        </form>
    );
};

interface WalletFundingModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    onSuccess: () => void;
}

export const WalletFundingModal: React.FC<WalletFundingModalProps> = ({
    isOpen,
    onClose,
    amount,
    onSuccess
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">Fund Wallet</h2>
                        <p className="text-sm text-gray-500 mt-1">Secure card payment via Stripe</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <Elements stripe={stripePromise}>
                        <CheckoutForm
                            amount={amount}
                            onSuccess={onSuccess}
                            onClose={onClose}
                        />
                    </Elements>
                </div>
            </div>
        </div>
    );
};

