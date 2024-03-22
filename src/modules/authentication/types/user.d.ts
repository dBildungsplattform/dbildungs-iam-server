import { type UserinfoResponse } from 'openid-client';

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
    personPermissions: PersonPermissions;
};
