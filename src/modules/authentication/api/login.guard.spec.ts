import { Mock } from 'vitest';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked} from '../../../../test/utils/createMock.js';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { LoginGuard } from './login.guard.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { KeycloakUserNotFoundError } from '../domain/keycloak-user-not-found.error.js';
import { HttpFoundException } from '../../../shared/error/http.found.exception.js';
import { AuthenticationErrorI18nTypes } from './dbiam-authentication.error.js';
import { StepUpLevel } from '../passport/oidc.strategy.js';

const canActivateSpy: Mock = vi.spyOn(AuthGuard(['jwt', 'oidc']).prototype as IAuthGuard, 'canActivate');
const logInSpy: Mock = vi.spyOn(AuthGuard(['jwt', 'oidc']).prototype as IAuthGuard, 'logIn');

describe('LoginGuard', () => {
    let module: TestingModule;
    let sut: LoginGuard;
    let configMock: DeepMocked<ConfigService>;
    let logger: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                LoginGuard,
                {
                    provide: ClassLogger,
                    useValue: createMock(ClassLogger),
                },
                {
                    provide: ConfigService<ServerConfig>,
                    useValue: createMock(ConfigService<ServerConfig>),
                },
            ],
        }).compile();

        sut = module.get(LoginGuard);
        configMock = module.get(ConfigService);
        logger = module.get(ClassLogger);
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('canActivate', () => {
        it('should call canActivate of superclass', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest.mockReturnValue({
                query: {
                    requiredStepUpLevel: StepUpLevel.GOLD,
                },
                isAuthenticated: vi.fn().mockReturnValue(false),
                passportUser: {
                    userinfo: {
                        preferred_username: 'test',
                    },
                },
                session: {
                    requiredStepUpLevel: StepUpLevel.GOLD,
                },
            });
            contextMock.switchToHttp().getResponse.mockReturnValue({});

            await sut.canActivate(contextMock);

            expect(canActivateSpy).toHaveBeenCalledWith(contextMock);
        });

        it('should short-circuit out when superclass canActivate fails', async () => {
            canActivateSpy.mockResolvedValueOnce(false);
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest<DeepMocked<Request>>().isAuthenticated.mockReturnValue(false);

            await expect(sut.canActivate(contextMock)).resolves.toBe(false);
        });

        it('should retry on exception', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockRejectedValueOnce('Something broke');

            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest<DeepMocked<Request>>().isAuthenticated.mockReturnValue(false);

            await expect(sut.canActivate(contextMock)).resolves.toBe(true);
            const request: Request = contextMock.switchToHttp().getRequest<Request>();
            expect(request.session.passport?.user.redirect_uri).not.toBeNull();
        });

        it('should call logIn of superclass', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest.mockReturnValue({
                query: {
                    requiredStepUpLevel: StepUpLevel.GOLD,
                },
                isAuthenticated: vi.fn().mockReturnValue(false),
                passportUser: {
                    userinfo: {
                        preferred_username: 'test',
                    },
                },
                session: {
                    requiredStepUpLevel: StepUpLevel.GOLD,
                },
            });

            await sut.canActivate(contextMock);

            expect(logInSpy).toHaveBeenCalledWith(contextMock.switchToHttp().getRequest());
        });

        it('should save returnUrl to session if it exists', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            const redirectUrl: string = faker.internet.url();
            contextMock.switchToHttp().getRequest.mockReturnValue({
                query: {
                    redirectUrl,
                },
                isAuthenticated: vi.fn().mockReturnValue(false),
                passportUser: {
                    userinfo: {
                        preferred_username: 'test',
                    },
                },
                session: {
                    redirectUrl: redirectUrl,
                },
            });

            await sut.canActivate(contextMock);

            expect(contextMock.switchToHttp().getRequest<Request>().session.redirectUrl).toBe(redirectUrl);
        });

        it('should ignore errors in super.canActivate', async () => {
            canActivateSpy.mockRejectedValueOnce(new Error());
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest.mockReturnValue({
                query: {
                    requiredStepUpLevel: StepUpLevel.GOLD,
                },
                isAuthenticated: vi.fn().mockReturnValue(true),
                passportUser: {
                    stepUpLevel: StepUpLevel.GOLD,
                },
                session: {},
            });
            contextMock.switchToHttp().getResponse.mockReturnValue({});
            await expect(sut.canActivate(contextMock)).resolves.toBe(true);
        });

        it('should ignore errors in super.logIn', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockRejectedValueOnce(new Error());
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest.mockReturnValue({
                query: {
                    requiredStepUpLevel: StepUpLevel.GOLD,
                },
                isAuthenticated: vi.fn().mockReturnValue(true),
                passportUser: {
                    stepUpLevel: StepUpLevel.GOLD,
                },
                session: {},
            });
            await expect(sut.canActivate(contextMock)).resolves.toBe(true);
        });

        it('should throw HttpFoundException exception if KeycloakUser does not exist', async () => {
            configMock.getOrThrow.mockReturnValueOnce({
                ERROR_PAGE_REDIRECT: faker.internet.url(),
                OIDC_CALLBACK_URL: faker.internet.url(),
            });

            canActivateSpy.mockRejectedValueOnce(new KeycloakUserNotFoundError());
            logInSpy.mockResolvedValueOnce(undefined);

            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest<DeepMocked<Request>>().isAuthenticated.mockReturnValue(false);
            await expect(sut.canActivate(contextMock)).rejects.toThrow(
                new HttpFoundException({
                    DbiamAuthenticationError: {
                        code: 403,
                        i18nKey: AuthenticationErrorI18nTypes.KEYCLOAK_USER_NOT_FOUND,
                    },
                }),
            );
        });

        it('should log successful login', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest.mockReturnValue({
                query: {
                    requiredStepUpLevel: 'gold',
                },
                isAuthenticated: vi.fn().mockReturnValue(true),
                passportUser: {
                    userinfo: {
                        preferred_username: 'test',
                    },
                },
                session: {
                    requiredStepUpLevel: StepUpLevel.GOLD,
                },
            });

            await sut.canActivate(contextMock);

            expect(logger.info).toHaveBeenCalledWith('Benutzer test hat sich im Schulportal angemeldet.');
        });
    });
});
