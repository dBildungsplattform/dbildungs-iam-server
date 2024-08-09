import { AuthParams } from '../ox-base-action.js';

export type OXUser = {
    id: string;
    email1: string;
    name: string;
    primaryEmail: string;
};

export type UserIdParams = AuthParams & {
    contextId: string;

    userId: string;
};
