import { createMock, DeepMocked} from '../../../../test/utils/createMock.js';
import { Request } from 'express';
import { PassportUser } from '../types/user.js';
import { SessionAccessTokenMiddleware } from './session-access-token.middleware.js';
import { Client, IntrospectionResponse, TokenSet, UserinfoResponse } from 'openid-client';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { LogOutOptions } from 'passport';
import { PersonPermissions } from '../domain/person-permissions.js';
import { ConfigService } from '@nestjs/config';
import { SystemConfig } from '../../../shared/config/system.config.js';

describe('sessionAccessTokenMiddleware', () => {
    let passportUser: PassportUser;
    let request: Request & Express.Request;
    let configService: Mocked<ConfigService>;

    beforeEach(() => {
        passportUser = createMock(PassportUser);
        request = createMock<Express.Request & Request & { passportUser: PassportUser; headers: object }>({
            passportUser,
            headers: {},
        });
        configService = createMock(ConfigService);
        configService.getOrThrow.mockImplementation((key: keyof SystemConfig) => {
            if (key === ('SYSTEM' as keyof SystemConfig)) {
                return {
                    STEP_UP_TIMEOUT_IN_SECONDS: 300,
                    STEP_UP_TIMEOUT_ENABLED: 'true',
                };
            }
            throw new Error(`Unexpected config key: ${key}`);
        });
    });

    it('should call next middleware', async () => {
        const nextMock: Mock = vi.fn();
        await new SessionAccessTokenMiddleware(createMock(), createMock(), configService).use(
            createMock(),
            createMock(),
            nextMock,
        );

        expect(nextMock).toHaveBeenCalledTimes(1);
    });

    describe('when the request does not contain a session with access token', () => {
        it('should not set authorization header', async () => {
            passportUser = createMock<PassportUser>({ access_token: undefined });
            request = { passportUser, headers: {}, session: { lastRouteChangeTime: Date.now() } } as Request;

            await new SessionAccessTokenMiddleware(createMock(), createMock(), configService).use(
                request,
                createMock(),
                vi.fn(),
            );

            expect(request.headers.authorization).toBeUndefined();
        });
    });

    describe('when the request does not contain a session', () => {
        it('should not set authorization header', async () => {
            request = { headers: {}, session: { lastRouteChangeTime: Date.now() } } as Request;

            await new SessionAccessTokenMiddleware(createMock(), createMock(), configService).use(
                request,
                createMock(),
                vi.fn(),
            );

            expect(request.headers.authorization).toBeUndefined();
        });
    });

    describe('when the request contains both a refresh and an access token', () => {
        let originalAccessToken: string;
        let originalRefreshToken: string;
        let client: DeepMocked<Client>;

        beforeEach(() => {
            client = createMock(Client);
            originalAccessToken = 'originalAccess';
            originalRefreshToken = 'originalRefresh';

            request.passportUser = {
                access_token: originalAccessToken,
                refresh_token: originalRefreshToken,
                userinfo: createMock(),
                personPermissions(): Promise<PersonPermissions> {
                    return Promise.resolve(createMock(PersonPermissions));
                },
            };
        });

        describe('when the access token is still active', () => {
            beforeEach(() => {
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: true }));
            });

            it('should not try to refresh it', async () => {
                await new SessionAccessTokenMiddleware(client, createMock(), configService).use(
                    request,
                    createMock(),
                    vi.fn(),
                );
                expect(client.introspect).toHaveBeenCalledWith(originalAccessToken);

                expect(request.passportUser?.access_token).toStrictEqual(originalAccessToken);
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

                    await new SessionAccessTokenMiddleware(client, createMock(), configService).use(
                        request,
                        createMock(),
                        vi.fn(),
                    );
                    expect(client.introspect).toHaveBeenCalledTimes(2);
                    expect(client.introspect).toHaveBeenNthCalledWith(1, originalAccessToken);
                    expect(client.introspect).toHaveBeenNthCalledWith(2, originalRefreshToken);
                    expect(client.refresh).toHaveBeenCalledWith(originalRefreshToken);

                    expect(request.passportUser?.access_token).toStrictEqual(newAccessToken);
                    expect(request.passportUser?.refresh_token).toStrictEqual(newRefreshToken);
                    expect(request.passportUser?.id_token).toStrictEqual(newIdToken);
                    expect(request.passportUser?.userinfo.sub).toStrictEqual('newSubjectId');
                });
            });
        });

        describe('when the refresh token is no longer active', () => {
            beforeEach(() => {
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: false }));
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: false }));
            });

            afterEach(() => {
                client.introspect.mockReset();
            });

            it('Should keep headers as they are', async () => {
                await new SessionAccessTokenMiddleware(client, createMock(), configService).use(
                    request,
                    createMock(),
                    vi.fn(),
                );
                expect(client.introspect).toHaveBeenCalledTimes(2);
                expect(client.introspect).toHaveBeenNthCalledWith(1, originalAccessToken);
                expect(client.introspect).toHaveBeenNthCalledWith(2, originalRefreshToken);
                expect(client.refresh).not.toHaveBeenCalled();

                expect(request.passportUser?.access_token).toStrictEqual(originalAccessToken);
                expect(request.passportUser?.refresh_token).toStrictEqual(originalRefreshToken);
            });

            it('should logout', async () => {
                await new SessionAccessTokenMiddleware(client, createMock(), configService).use(
                    request,
                    createMock(),
                    vi.fn(),
                );

                expect(request.logout).toHaveBeenCalled();
            });

            it('should log exceptions which have been thrown', async () => {
                const logger: ClassLogger = createMock(ClassLogger);

                request.logout = (done: ((err: unknown) => void) | LogOutOptions): void => {
                    if (typeof done === 'function') {
                        done('Something broke');
                    }
                };

                await new SessionAccessTokenMiddleware(client, logger, configService).use(
                    request,
                    createMock(),
                    vi.fn(),
                );
                expect(logger.logUnknownAsError).toHaveBeenCalled();
            });
        });

        describe('when an exception is thrown on refresh', () => {
            it('will log the message of an error', async () => {
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: false }));
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: true }));

                client.refresh.mockRejectedValue(new Error('Something went wrong'));
                const loggerMock: ClassLogger = createMock(ClassLogger);
                await new SessionAccessTokenMiddleware(client, loggerMock, configService).use(
                    request,
                    createMock(),
                    vi.fn(),
                );

                expect(loggerMock.warning).toHaveBeenCalledWith('Something went wrong');
            });

            it('will log everything else as is', async () => {
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: false }));
                client.introspect.mockResolvedValueOnce(createMock<IntrospectionResponse>({ active: true }));

                client.refresh.mockRejectedValue('Something went seriously wrong');
                const loggerMock: ClassLogger = createMock(ClassLogger);
                await new SessionAccessTokenMiddleware(client, loggerMock, createMock()).use(
                    request,
                    createMock(),
                    vi.fn(),
                );

                expect(loggerMock.warning).toHaveBeenCalledWith(
                    'Refreshing Token Failed With Unknown Catch',
                    'Something went seriously wrong',
                );
            });
        });
    });
});
