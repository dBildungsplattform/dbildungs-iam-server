import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Request } from 'express';
import { PassportUser } from '../types/user.js';
import { SessionAccessTokenMiddleware } from './session-access-token.middleware.js';
import { Client, IntrospectionResponse, TokenSet, UserinfoResponse } from 'openid-client';

describe('sessionAccessTokenMiddleware', () => {
    let passportUser: PassportUser;
    let request: Request;

    beforeEach(() => {
        passportUser = createMock<PassportUser>();
        request = { passportUser, headers: {} } as Request;
    });

    it('should call next middleware', async () => {
        const nextMock: jest.Mock = jest.fn();

        await new SessionAccessTokenMiddleware(createMock(), createMock()).use(createMock(), createMock(), nextMock);

        expect(nextMock).toHaveBeenCalledTimes(1);
    });

    describe('when the request contains a valid access token', () => {
        it('should set the authorization header on the request', async () => {
            const passportUser: PassportUser = createMock<PassportUser>({
                access_token: faker.string.alphanumeric(64),
            });
            const request: Request = { passportUser, headers: {} } as Request;

            const clientMock = createMock<Client>();
            clientMock.introspect.mockResolvedValue(createMock<IntrospectionResponse>({ active: true }));

            await new SessionAccessTokenMiddleware(clientMock, createMock()).use(request, createMock(), jest.fn());

            expect(request.headers.authorization).toBe(`Bearer ${passportUser.access_token}`);
        });
    });

    describe('when the request does not contain a session with access token', () => {
        it('should not set authorization header', async () => {
            const passportUser: PassportUser = createMock<PassportUser>({ access_token: undefined });
            const request: Request = { passportUser, headers: {} } as Request;

            await new SessionAccessTokenMiddleware(createMock(), createMock()).use(request, createMock(), jest.fn());

            expect(request.headers.authorization).toBeUndefined();
        });
    });

    describe('when the request does not contain a session', () => {
        it('should not set authorization header', async () => {
            const request: Request = { headers: {} } as Request;

            await new SessionAccessTokenMiddleware(createMock(), createMock()).use(request, createMock(), jest.fn());

            expect(request.headers.authorization).toBeUndefined();
        });
    });

    describe('when the request contains both a refresh and an access token', () => {
        let originalAccessToken: string;
        let originalRefreshToken: string;
        let client: DeepMocked<Client>;

        beforeEach(() => {
            client = createMock<Client>();
            originalAccessToken = 'originalAccess';
            originalRefreshToken = 'originalRefresh';

            request.passportUser = {
                access_token: originalAccessToken,
                refresh_token: originalRefreshToken,
                userinfo: createMock(),
            };
        });

        describe('when the access token is still active', () => {
            beforeEach(() => {
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: true }));
            });

            it('should not try to refresh it', async () => {
                await new SessionAccessTokenMiddleware(client, createMock()).use(request, createMock(), jest.fn());
                expect(client.introspect).toHaveBeenCalledWith(originalAccessToken);

                expect(request.passportUser?.access_token).toStrictEqual(originalAccessToken);
                expect(request.headers.authorization).toStrictEqual(`Bearer ${originalAccessToken}`);
            });
        });

        describe('when the access token is no longer active', () => {
            beforeEach(() => {
                client.introspect.mockReset();
            });

            describe('when the refresh token is still active', () => {
                it('should try to refresh the access token', async () => {
                    const newAccessToken: string = 'newAccess';
                    const newRefreshToken: string = 'newRefresh';
                    const newIdToken: string = 'newId';

                    client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: false }));
                    client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: true }));
                    client.refresh.mockResolvedValueOnce(
                        createMock<TokenSet>({
                            access_token: newAccessToken,
                            refresh_token: newRefreshToken,
                            id_token: newIdToken,
                        }),
                    );

                    client.userinfo.mockResolvedValueOnce(createMock<UserinfoResponse>({ sub: 'newSubjectId' }));

                    await new SessionAccessTokenMiddleware(client, createMock()).use(request, createMock(), jest.fn());
                    expect(client.introspect).toHaveBeenCalledTimes(2);
                    expect(client.introspect).toHaveBeenNthCalledWith(1, originalAccessToken);
                    expect(client.introspect).toHaveBeenNthCalledWith(2, originalRefreshToken);
                    expect(client.refresh).toHaveBeenCalledWith(originalRefreshToken);

                    expect(request.passportUser?.access_token).toStrictEqual(newAccessToken);
                    expect(request.passportUser?.refresh_token).toStrictEqual(newRefreshToken);
                    expect(request.passportUser?.id_token).toStrictEqual(newIdToken);
                    expect(request.passportUser?.userinfo.sub).toStrictEqual('newSubjectId');

                    expect(request.headers.authorization).toStrictEqual(`Bearer ${newAccessToken}`);
                });
            });
        });

        describe('when the refresh token is no longer active', () => {
            it('Should keep headers as they are', async () => {
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: false }));
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: false }));

                await new SessionAccessTokenMiddleware(client, createMock()).use(request, createMock(), jest.fn());
                expect(client.introspect).toHaveBeenCalledTimes(2);
                expect(client.introspect).toHaveBeenNthCalledWith(1, originalAccessToken);
                expect(client.introspect).toHaveBeenNthCalledWith(2, originalRefreshToken);
                expect(client.refresh).not.toHaveBeenCalled();

                expect(request.passportUser?.access_token).toStrictEqual(originalAccessToken);
                expect(request.passportUser?.refresh_token).toStrictEqual(originalRefreshToken);

                expect(request.headers.authorization).toStrictEqual(`Bearer ${originalAccessToken}`);
            });
        });
    });
});
