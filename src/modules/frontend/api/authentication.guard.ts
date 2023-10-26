import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { TokenSet } from 'openid-client';

import { SessionData } from './frontend.controller.js';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
    // Only validates if session contains a non expired tokenset
    public canActivate(context: ExecutionContext): boolean {
        const request: FastifyRequest = context.switchToHttp().getRequest<FastifyRequest>();
        const session: SessionData = request.session as SessionData;

        const tokens: TokenSet | undefined = session.get('keycloak_tokens');

        return !!tokens && !tokens.expired();
    }
}
