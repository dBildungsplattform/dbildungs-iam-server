import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import { OIDC_CLIENT } from '../services/oidc-client.service.js';
import { Client } from 'openid-client';
import JwksRsa, { passportJwtSecret } from 'jwks-rsa';
import { JwtPayload, decode } from 'jsonwebtoken';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { KeycloakUserNotFoundError } from '../domain/keycloak-user-not-found.error.js';

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    public constructor(
        @Inject(OIDC_CLIENT) client: Client,
        private personRepo: PersonRepository,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKeyProvider: passportJwtSecret(<JwksRsa.ExpressJwtOptions>{
                jwksUri: client.issuer.metadata.jwks_uri,
            }),
            passReqToCallback: true,
        } satisfies StrategyOptionsWithRequest);
    }

    public async validate(_request: Request, _jwtPayload: string): Promise<{ access_token: string }> {
        const accessToken: string | null = ExtractJwt.fromAuthHeaderAsBearerToken()(_request);

        if (accessToken) {
            const decoded: string | JwtPayload | null = decode(accessToken);
            const subjectId: string | undefined = decoded?.sub as string | undefined;

            if (subjectId) {
                const person: Option<Person<true>> = await this.personRepo.findByKeycloakUserId(subjectId);
                if (!person) {
                    throw new KeycloakUserNotFoundError();
                }
            }
        }

        return { access_token: accessToken || '' };
    }
}
