import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { SessionData } from './frontend.controller.js';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
    // Only validates if session contains an access_token
    public canActivate(context: ExecutionContext): boolean {
        const request: FastifyRequest = context.switchToHttp().getRequest<FastifyRequest>();
        const session: SessionData = request.session as SessionData;
        return !!session?.access_token;
    }
}
