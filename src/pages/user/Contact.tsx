import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '../../components/user/Navbar';
import { api } from '../../utils/axios';

interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
}

const Contact: React.FC = () => {
    const [form, setForm] = useState<FormState>({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('/contact', form, { withCredentials: true });
            setSuccess(true);
            setForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });

        } catch (err: unknown) {
            const typedErr = err as { response?: { data?: { message?: string } } };
            const msg = typedErr?.response?.data?.message || 'Failed to send message. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                        Get in Touch
                    </h1>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        Have questions about renting a vehicle or listing your own? Our team is here to help you every step of the way.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                                <Phone className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
                            <p className="text-gray-500 mb-4">Mon-Fri from 8am to 5pm.</p>
                            <a href="tel:+1234567890" className="text-blue-600 font-semibold hover:text-blue-700">
                                +1 (555) 123-4567
                            </a>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                            <p className="text-gray-500 mb-4">We're here to help.</p>
                            <a href="mailto:support@rentnride.com" className="text-blue-600 font-semibold hover:text-blue-700">
                                support@rentnride.com
                            </a>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Office</h3>
                            <p className="text-gray-500 mb-4">Come say hello.</p>
                            <p className="text-blue-600 font-semibold">
                                123 Innovation Drive<br />Tech City, TC 90210
                            </p>
                        </div>
                    </div>

                    {}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12">
                        {success ? (
                            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">Message Sent!</h2>
                                <p className="text-gray-500 max-w-sm mb-8">
                                    Thank you for reaching out. We've sent a confirmation to your email and will get back to you within <strong>24–48 hours</strong>.
                                </p>
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-md"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 mb-8">Send us a message</h2>
                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">First name</label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={form.firstName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium text-gray-900 bg-gray-50 focus:bg-white"
                                                placeholder="Jane"
                                                maxLength={50}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">Last name</label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={form.lastName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium text-gray-900 bg-gray-50 focus:bg-white"
                                                placeholder="Smith"
                                                maxLength={50}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium text-gray-900 bg-gray-50 focus:bg-white"
                                            placeholder="jane@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-700">Subject</label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            value={form.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium text-gray-900 bg-gray-50 focus:bg-white"
                                            placeholder="How can we help?"
                                            maxLength={100}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                                            Message
                                            <span className="text-gray-400 font-normal ml-2">({form.message.length}/2000)</span>
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={5}
                                            value={form.message}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium text-gray-900 bg-gray-50 focus:bg-white resize-y"
                                            placeholder="Tell us more about your inquiry..."
                                            maxLength={2000}
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
