import { type UserinfoResponse } from 'openid-client';
import { PersonPermissions } from '../domain/person-permissions.js';

/**
 * User-type for keycloak-connect (parsed JWT)
 */
export type User = UserinfoResponse;

/**
 * User for passport session
 */
export type PassportUser = {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    userinfo: UserinfoResponse;
    personPermissions: () => Promise<PersonPermissions>;
};
