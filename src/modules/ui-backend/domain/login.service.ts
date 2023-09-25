import {Injectable} from '@nestjs/common';
import {errors, Issuer, TokenSet} from 'openid-client';
import {KeycloakClientError} from '../../../shared/error/index.js';
import OPError = errors.OPError;
import {UserAuthenticationFailedError} from "../../../shared/error/user-authentication-failed.error.js";

@Injectable()
export class LoginService {

    private static readonly REALM_NAME = 'http://localhost:8680/realms/schulportal';
    private static readonly CLIENT_ID = 'schulportal';

    public async getTokenForUser(username: string, password: string): Promise<TokenSet> {
        try {
            const keycloakIssuer = await Issuer.discover(
                LoginService.REALM_NAME,
            );
            const client = new keycloakIssuer.Client({
                client_id: LoginService.CLIENT_ID,
                token_endpoint_auth_method: 'none',
            });
            return  await client.grant({
                grant_type: 'password',
                username: username,
                password: password,
            });

        } catch(e: any) {
            if (e instanceof OPError && e.error === 'invalid_grant') {
               throw new UserAuthenticationFailedError('User could not be authenticated successfully.');
            }
            throw new KeycloakClientError('KeyCloak service did not respond.');
        }
    }

}

