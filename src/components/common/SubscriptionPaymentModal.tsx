import { env } from "../../config/env";
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { X, Loader2, Crown, CheckCircle } from "lucide-react";
import { api } from "../../utils/axios";

const stripePromise = loadStripe(env.VITE_STRIPE_PUBLIC_KEY || "pk_test_sample");

interface CheckoutFormProps {
    planId: string;
    planName: string;
    amount: number;
    clientSecret: string;
    onSuccess: () => void;
    onClose: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ planName, amount, clientSecret, onSuccess, onClose }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!stripe || !elements || !clientSecret) return;

        setIsProcessing(true);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement },
        });

        if (stripeError) {
            setError(stripeError.message || "Payment failed. Please try again.");
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            try {
                await api.post("/subscriptions/verify-payment", { paymentIntentId: paymentIntent.id });
                setSuccess(true);
                setTimeout(onSuccess, 1800);
            } catch (verr: unknown) {
                const error = verr as { response?: { data?: { message?: string } } }; setError(error.response?.data?.message || "Payment successful, but failed to activate subscription.");
                setIsProcessing(false);
            }
        } else {
            setError("Unexpected payment status. Please contact support.");
            setIsProcessing(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Subscription Activated!</h3>
                <p className="text-sm text-gray-500">
                    You are now subscribed to the <span className="font-medium text-gray-800">{planName}</span> plan.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{error}</div>
            )}
            {}
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-gray-900">{planName}</span>
                    </div>
                    <span className="text-xl font-bold text-emerald-700">₹{amount.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-xs text-emerald-700 mt-1.5">One-time payment. Subscription activates immediately after payment.</p>
            </div>
            {}
            <div className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-3">Card Details</p>
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: "16px",
                                color: "#424770",
                                "::placeholder": { color: "#aab7c4" },
                            },
                            invalid: { color: "#9e2146" },
                        },
                    }}
                />
            </div>
            <div className="flex gap-3 mt-1">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                    {isProcessing ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    ) : (
                        <>Pay ₹{amount.toLocaleString("en-IN")}</>
                    )}
                </button>
            </div>
        </form>
    );
};

interface SubscriptionPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planId: string;
    onSuccess: () => void;
}

const ModalContent: React.FC<SubscriptionPaymentModalProps> = ({ planId, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [intentData, setIntentData] = useState<{ clientSecret: string; amount: number; planName: string } | null>(null);

    useEffect(() => {
        const fetchIntent = async () => {
            try {
                const res = await api.post("/subscriptions/payment-intent", { planId });
                setIntentData(res.data.data);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } } }; setError(error.response?.data?.message || "Failed to initialise payment.");
            } finally {
                setLoading(false);
            }
        };
        if (planId) fetchIntent();
    }, [planId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (error || !intentData) {
        return (
            <div className="py-8 text-center">
                <p className="text-red-600 text-sm">{error || "Unable to load payment."}</p>
                <button onClick={onClose} className="mt-4 text-sm text-gray-500 underline">Close</button>
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret: intentData.clientSecret }}>
            <CheckoutForm
                planId={planId}
                planName={intentData.planName}
                amount={intentData.amount}
                clientSecret={intentData.clientSecret}
                onSuccess={onSuccess}
                onClose={onClose}
            />
        </Elements>
    );
};

export const SubscriptionPaymentModal: React.FC<SubscriptionPaymentModalProps> = (props) => {
    if (!props.isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
                {}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">Subscribe</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Secure payment via Stripe</p>
                    </div>
                    <button
                        onClick={props.onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <ModalContent {...props} />
                </div>
            </div>
        </div>
    );
};

