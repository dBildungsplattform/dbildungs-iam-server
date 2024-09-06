declare module 'express-session' {
    interface SessionData {
        redirectUrl?: string;
        passport?: {
            user: {
                redirect_uri?: string;
            };
        };
    }
}

export {};
