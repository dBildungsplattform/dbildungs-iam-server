import { PassportUser, User } from './user.js';

declare module 'express' {
    interface Request {
        user?: User;
        accessTokenJWT?: string;
        passportUser?: PassportUser;
    }
}

export {};
