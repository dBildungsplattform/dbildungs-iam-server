declare module 'express-session' {
    interface SessionData {
        userId: string;
        access_token: string;
    }
}

export {};
