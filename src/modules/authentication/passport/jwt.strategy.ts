import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import { OIDC_CLIENT } from '../services/oidc-client.service.js';
import { Client } from 'openid-client';
import JwksRsa, { passportJwtSecret } from 'jwks-rsa';

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    public constructor(@Inject(OIDC_CLIENT) client: Client) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKeyProvider: passportJwtSecret(<JwksRsa.ExpressJwtOptions>{
                jwksUri: client.issuer.metadata.jwks_uri,
            }),
            passReqToCallback: true,
        } satisfies StrategyOptionsWithRequest);
    }

    public validate(_request: Request, _jwtPayload: string): { access_token: string } {
        const accessToken: string | null = ExtractJwt.fromAuthHeaderAsBearerToken()(_request);
        return { access_token: accessToken || '' };
    }
}
