import { Injectable } from '@nestjs/common';
import { Client, errors, Issuer, TokenSet } from 'openid-client';
import OPError = errors.OPError;
import { KeycloakClientError } from '../../../shared/error/index.js';
import { UserAuthenticationFailedError } from '../../../shared/error/user-authentication-failed.error.js';

@Injectable()
export class LoginService {
    private static readonly REALM_NAME: string = 'http://localhost:8080/realms/schulportal';

    private static readonly CLIENT_ID: string = 'schulportal';

    public async getTokenForUser(username: string, password: string): Promise<TokenSet> {
        try {
            const keycloakIssuer: Issuer = await Issuer.discover(LoginService.REALM_NAME);
            const client: Client = new keycloakIssuer.Client({
                client_id: LoginService.CLIENT_ID,
                token_endpoint_auth_method: 'none',
            });
            return await client.grant({
                grant_type: 'password',
                username: username,
                password: password,
            });
        } catch (e) {
            if (e instanceof OPError && e.error === 'invalid_grant') {
                throw new UserAuthenticationFailedError('User could not be authenticated successfully.');
            }
            throw new KeycloakClientError('KeyCloak service did not respond.');
        }
    }
}
