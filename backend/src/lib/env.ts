import {z} from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string(),

    CLERK_PUBLISHABLE_KEY: z.string(),
    CLERK_SECRET_KEY: z.string(),
    CLERK_WEBHOOK_SECRET: z.string(),

    FRONTEND_URL: z.string().url(),

    POLAR_ACCESS_TOKEN: z.string().optional(),
    POLAR_WEBHOOK_SECRET: z.string().optional(),
    POLAR_API_BASE: z.string().url().default("https://api.polar.sh"),
    POLAR_CHECKOUT_PRODUCT_ID: z.string(),

    STREAM_API_KEY: z.string().min(1),
    STREAM_API_SECRET: z.string().min(1),

    IMAGEKIT_PUBLIC_KEY: z.string().min(1),
    IMAGEKIT_PRIVATE_KEY: z.string().min(1),
    IMAGEKIT_URL_ENDPOINT: z.string().url(),

    SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        throw new Error(`Invalid environment variables: ${parsed.error.message}`);
    }
    return parsed.data;
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
    if (!cachedEnv) {
        cachedEnv = loadEnv();
    }
    return cachedEnv;
}