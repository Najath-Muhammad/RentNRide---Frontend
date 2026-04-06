import { z } from 'zod';

const envSchema = z.object({
    VITE_API_BASE_URL: z.string().url(),
    VITE_GOOGLE_CLIENT_ID: z.string().min(1),
    VITE_LOCATIONIQ_KEY: z.string().min(1),
    VITE_STRIPE_PUBLIC_KEY: z.string().min(1),
    VITE_FIREBASE_API_KEY: z.string().min(1),
    VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    VITE_FIREBASE_PROJECT_ID: z.string().min(1),
    VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1),
    VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
    VITE_FIREBASE_APP_ID: z.string().min(1),
    VITE_FIREBASE_VAPID_KEY: z.string().min(1),
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
    throw new Error('Invalid environment variables');
}

export const env = _env.data;
