import { PassportUser, User } from '../types/user.js';

declare module 'express' {
    interface Request {
        user?: User;
        accessTokenJWT?: string;
        passportUser?: PassportUser;
    }
}

export {};
