import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CsrfTokenService } from '../services/csrf-token-service.js';

@Injectable()
export class CsrfRefreshMiddleware implements NestMiddleware {
    public constructor(private readonly csrfTokenService: CsrfTokenService) {}

    public use(request: Request, response: Response, next: NextFunction): void {
        // Auto-generate CSRF token on authenticated requests
        if (request.isAuthenticated() && request.session) {
            const token: string = this.csrfTokenService.generateToken(request);
            response.setHeader('X-CSRF-Token', token);
        }

        next();
    }
}
