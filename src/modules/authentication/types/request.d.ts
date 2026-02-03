import { Request as OriginalRequest } from 'express';
import { PassportUser, User } from './user.js';

declare module 'express' {
    interface Request extends OriginalRequest {
        user?: User;
        accessTokenJWT?: string;
        passportUser?: PassportUser;

        // Overloads for passport's methods
        // logout(options: passport.LogOutOptions, done: (err: unknown) => void): void;
        // logout(done: (err: unknown) => void): void;
        // logOut(options: passport.LogOutOptions, done: (err: unknown) => void): void;
        // logOut(done: (err: unknown) => void): void;
        // isAuthenticated(): this is AuthenticatedRequest;
    }

    interface AuthenticatedRequest extends Request {
        user: User;
    }
}

export {};
