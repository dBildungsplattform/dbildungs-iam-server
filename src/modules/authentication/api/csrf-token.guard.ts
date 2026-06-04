import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CsrfTokenService } from '../services/csrf-token.service.js';
import { Public } from './public.decorator.js';
@Injectable()
export class CsrfProtectionGuard implements CanActivate {
    public constructor(
        private readonly csrfTokenService: CsrfTokenService,
        private readonly reflector: Reflector,
    ) {}

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
        if (this.isPublicRoute(context)) {
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

    private isPublicRoute(context: ExecutionContext): boolean {
        return this.reflector.getAllAndOverride<boolean>(Public, [context.getHandler(), context.getClass()]) ?? false;
    }
}
