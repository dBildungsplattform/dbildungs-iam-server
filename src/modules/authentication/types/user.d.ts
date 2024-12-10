import { type UserinfoResponse } from 'openid-client';
import { PersonPermissions } from '../domain/person-permissions.js';
import { StepUpLevel } from '../passport/oidc.strategy.js';

/**
 * User for passport session
 */
export type PassportUser = {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    userinfo: UserinfoResponse;
    personPermissions: () => Promise<PersonPermissions>;
    stepUpLevel?: StepUpLevel;
};
