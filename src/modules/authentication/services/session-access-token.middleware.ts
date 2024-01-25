import { Request, Response } from 'express';

/**
 * Copies the access token from a session, if it exists
 */
export function sessionAccessTokenMiddleware(req: Request, _res: Response, next: (error?: unknown) => void): void {
    const accessToken: string | undefined = req.passportUser?.access_token;

    if (accessToken) {
        req.headers.authorization = `Bearer ${accessToken}`;
    }

    next();
}
