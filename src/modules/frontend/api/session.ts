export type SessionData = Express.Request['session'] &
    Partial<{
        user_id: string;
        access_token: string;
    }>;
