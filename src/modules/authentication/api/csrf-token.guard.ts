import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { CsrfTokenService } from '../services/csrf-token.service.js';

@Injectable()
export class CsrfProtectionGuard implements CanActivate {
    public constructor(private readonly csrfTokenService: CsrfTokenService) {}

    public canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest<Request>();

        // Skip safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
            return true;
        }

        // Skip JWT requests (Authorization: Bearer ...)
        if (this.isJwtRequest(request)) {
            return true;
        }

        // Skip API-key requests
        const apiKeyHeader: string | string[] | undefined = request.headers['api-key'];
        if (typeof apiKeyHeader === 'string' || Array.isArray(apiKeyHeader)) {
            return true;
        }

        // Skip public routes
        if (this.isPublicRoute(request.path)) {
            return true;
        }

        // Validate CSRF token for everything else
        if (!this.csrfTokenService.validateToken(request)) {
            throw new BadRequestException('Invalid or missing CSRF token');
        }

        return true;
    }

    private isJwtRequest(request: Request): boolean {
        const authHeader: string = request.headers.authorization || '';
        return authHeader.startsWith('Bearer ');
    }

    private isPublicRoute(path: string): boolean {
        const publicRoutes: string[] = ['/api/health', '/api/auth/login', '/api/docs', '/api/docs-json'];
        return publicRoutes.some((route: string) => path.startsWith(route));
    }
}
