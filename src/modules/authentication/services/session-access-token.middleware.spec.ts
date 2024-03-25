import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Request } from 'express';
import { PassportUser } from '../types/user.js';
import {SessionAccessTokenMiddleware} from "./session-access-token.middleware.js";

describe('sessionAccessTokenMiddleware', () => {
    it('should call next middleware', () => {
        const nextMock: jest.Mock = jest.fn();

        new SessionAccessTokenMiddleware().use(createMock(), createMock(), nextMock);

        expect(nextMock).toHaveBeenCalledTimes(1);
    });

    describe('when the request a valid session', () => {
        it('should set the authorization header on the request', () => {
            const passportUser: PassportUser = createMock<PassportUser>({
                access_token: faker.string.alphanumeric(64),
            });
            const request: Request = { passportUser, headers: {} } as Request;

            new SessionAccessTokenMiddleware().use(request, createMock(), jest.fn());

            expect(request.headers.authorization).toBe(`Bearer ${passportUser.access_token}`);
        });
    });

    describe('when the request does not contain a session with access token', () => {
        it('should not set authorization header', () => {
            const passportUser: PassportUser = createMock<PassportUser>({ access_token: undefined });
            const request: Request = { passportUser, headers: {} } as Request;

            new SessionAccessTokenMiddleware().use(request, createMock(), jest.fn());

            expect(request.headers.authorization).toBeUndefined();
        });
    });

    describe('when the request does not contain a session', () => {
        it('should not set authorization header', () => {
            const request: Request = { headers: {} } as Request;

            new SessionAccessTokenMiddleware().use(request, createMock(), jest.fn());

            expect(request.headers.authorization).toBeUndefined();
        });
    });
});
