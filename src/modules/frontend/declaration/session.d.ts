declare module 'express-session' {
    interface SessionData {
        redirectUrl?: string;
    }
}

export {};
