import { Injectable, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import crypto from 'crypto';

@Injectable()
export class CsrfTokenService {
    public generateToken(request: Request): string {
        const token: string = crypto.randomBytes(32).toString('hex');

        if (!request.session) {
            throw new BadRequestException('Session not initialized');
        }

        request.session.csrfToken = token;
        request.session.touch();

        return token;
    }

    public validateToken(request: Request, token?: string): boolean {
        const sessionToken: string | undefined = request.session?.csrfToken;
        const requestToken: string | undefined = token || this.extractTokenFromRequest(request);

        if (!sessionToken || !requestToken) {
            return false;
        }

        try {
            return crypto.timingSafeEqual(Buffer.from(sessionToken), Buffer.from(requestToken));
        } catch {
            return false;
        }
    }

    private extractTokenFromRequest(request: Request): string | undefined {
        const headerToken: unknown = request.headers['x-csrf-token'];
        if (this.isNonEmptyString(headerToken)) {
            return headerToken;
        }

        const queryToken: unknown = request.query['csrfToken'];
        if (this.isNonEmptyString(queryToken)) {
            return queryToken;
        }

        return undefined;
    }

    private isNonEmptyString(value: unknown): value is string {
        return typeof value === 'string' && value.length > 0;
    }
}
