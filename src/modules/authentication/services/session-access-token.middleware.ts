import { Request, Response } from 'express';
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { OIDC_CLIENT } from './oidc-client.service.js';
import { Client, TokenSet } from 'openid-client';
import { ClassLogger } from '../../../core/logging/class-logger.js';

/**
 * Copies the access token from a session, if it exists
 */

@Injectable()
export class SessionAccessTokenMiddleware implements NestMiddleware {
    public constructor(
        @Inject(OIDC_CLIENT) private client: Client,
        private logger: ClassLogger,
    ) {}

    public async use(req: Request, _res: Response, next: (error?: unknown) => void): Promise<void> {
        let accessToken: string | undefined = req.passportUser?.access_token;

        const refreshToken = req.passportUser?.refresh_token;
        if (accessToken) {
            if (!(await this.client.introspect(accessToken)).active)
                if (refreshToken && (await this.client.introspect(refreshToken)).active && req.passportUser) {
                    // Do we have a refresh token and somewhere to store the result of the refresh?
                    try {
                        const tokens: TokenSet = await this.client.refresh(refreshToken);
                        if (tokens) {
                            req.passportUser.refresh_token = tokens.refresh_token;
                            req.passportUser.access_token = tokens.access_token;
                            req.passportUser.id_token = tokens.id_token;
                            req.passportUser.userinfo = await this.client.userinfo(tokens);

                            accessToken = req.passportUser.access_token;
                        }
                    } catch (e: unknown) {
                        if (e instanceof Error) {
                            this.logger.warning(e.message);
                        } else {
                            this.logger.warning(JSON.stringify(e));
                        }
                    }
                }

            req.headers.authorization = `Bearer ${accessToken}`;
        }

        next();
    }
}
