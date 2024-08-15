import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';

import { AxiosResponse } from 'axios';
import { Observable, of, throwError } from 'rxjs';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import {
    AssignTokenResponse,
    PrivacyIdeaToken,
    TokenOTPSerialResponse,
    TokenVerificationResponse,
    User,
} from './privacy-idea-api.types.js';
import { TokenError } from './api/error/token.error.js';
import { ConfigTestModule } from '../../../test/utils/index.js';

const mockErrorMsg: string = `Mock error`;

export const mockPrivacyIdeaToken: PrivacyIdeaToken = {
    active: true,
    count: 5,
    count_window: 10,
    description: 'Test token for mock data',
    failcount: 2,
    id: 12345,
    info: {
        hashlib: 'SHA-256',
        timeShift: '0',
        timeStep: '30',
        timeWindow: '5',
        tokenkind: 'software',
    },
    locked: false,
    maxfail: 3,
    otplen: 6,
    realms: ['exampleRealm'],
    resolver: 'exampleResolver',
    revoked: false,
    rollout_state: 'completed',
    serial: 'ABC123456',
    sync_window: 30,
    tokengroup: ['exampleGroup'],
    tokentype: 'TOTP',
    user_editable: true,
    user_id: 'user123',
    user_realm: 'userRealm',
    username: 'exampleUser',
};

export const mockUser: User = {
    description: 'Test user for mock data',
    editable: true,
    email: 'testuser@example.com',
    givenname: 'John',
    mobile: '+1234567890',
    phone: '+0987654321',
    resolver: 'exampleResolver',
    surname: 'Doe',
    userid: 'user123',
    username: 'johndoe',
};

const mockJWTTokenResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: { token: `jwt-token` } } } } as AxiosResponse);

const mockEmptyUserResponse = (): Observable<AxiosResponse> => of({ data: { result: { value: [] } } } as AxiosResponse);

const mockUserResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: [mockUser] } } } as AxiosResponse);

const mockGoogleImageResponse = (): Observable<AxiosResponse> =>
    of({ data: { detail: { googleurl: { img: `base64img` } } } } as AxiosResponse);

const mockEmptyPostResponse = (): Observable<AxiosResponse> => of({} as AxiosResponse);

const mockTokenResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: { tokens: [mockPrivacyIdeaToken] } } } } as AxiosResponse);

const mockErrorResponse = (): never => {
    throw new Error(mockErrorMsg);
};

const mockNonErrorThrow = (): never => {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw { message: mockErrorMsg };
};

const mockTokenVerificationResponse: TokenVerificationResponse = {
    result: {
        value: {
            count: 1,
            tokens: [
                {
                    username: '',
                    active: false,
                    count: 0,
                    count_window: 0,
                    description: '',
                    failcount: 0,
                    id: 0,
                    info: {
                        hashlib: '',
                        timeShift: '',
                        timeStep: '',
                        timeWindow: '',
                        tokenkind: '',
                    },
                    locked: false,
                    maxfail: 0,
                    otplen: 0,
                    realms: [],
                    resolver: '',
                    revoked: false,
                    rollout_state: '',
                    serial: '',
                    sync_window: 0,
                    tokengroup: [],
                    tokentype: '',
                    user_id: '',
                    user_realm: '',
                },
            ],
            current: 0,
            next: null,
            prev: null,
        },
        status: false,
    },
    id: 0,
    jsonrpc: '',
    time: 0,
    version: '',
    versionnumber: '',
    signature: '',
};

const mockTokenVerificationResponseNotFound: TokenVerificationResponse = {
    result: {
        value: {
            count: 0,
            tokens: [],
            current: 0,
            next: null,
            prev: null,
        },
        status: false,
    },
    id: 0,
    jsonrpc: '',
    time: 0,
    version: '',
    versionnumber: '',
    signature: '',
};

const mockTokenVerificationResponseAlreadyAssigned: TokenVerificationResponse = {
    result: {
        value: {
            count: 1,
            tokens: [
                {
                    username: 'user123',
                    active: false,
                    count: 0,
                    count_window: 0,
                    description: '',
                    failcount: 0,
                    id: 0,
                    info: {
                        hashlib: '',
                        timeShift: '',
                        timeStep: '',
                        timeWindow: '',
                        tokenkind: '',
                    },
                    locked: false,
                    maxfail: 0,
                    otplen: 0,
                    realms: [],
                    resolver: '',
                    revoked: false,
                    rollout_state: '',
                    serial: '',
                    sync_window: 0,
                    tokengroup: [],
                    tokentype: '',
                    user_id: '',
                    user_realm: '',
                },
            ],
            current: 0,
            next: null,
            prev: null,
        },
        status: false,
    },
    id: 0,
    jsonrpc: '',
    time: 0,
    version: '',
    versionnumber: '',
    signature: '',
};

const mockTokenOTPSerialResponse: TokenOTPSerialResponse = {
    result: {
        value: {
            serial: 'ABC123456',
            count: 0,
        },
        status: false,
    },
    id: 0,
    jsonrpc: '',
    time: 0,
    version: '',
    versionnumber: '',
    signature: '',
};

const mockTokenOTPSerialResponseInvalid: TokenOTPSerialResponse = {
    result: {
        value: {
            serial: 'INVALID',
            count: 0,
        },
        status: false,
    },
    id: 0,
    jsonrpc: '',
    time: 0,
    version: '',
    versionnumber: '',
    signature: '',
};

const mockAssignTokenResponse: AssignTokenResponse = {
    id: 1,
    jsonrpc: '2.0',
    result: {
        status: true,
        value: true,
    },
    time: 1234567890,
    version: 'v1',
    versionnumber: '1.0',
    signature: 'signature',
};

describe(`PrivacyIdeaAdministrationService`, () => {
    let service: PrivacyIdeaAdministrationService;
    let httpServiceMock: DeepMocked<HttpService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                PrivacyIdeaAdministrationService,
                { provide: HttpService, useValue: createMock<HttpService>() },
            ],
        }).compile();

        service = module.get<PrivacyIdeaAdministrationService>(PrivacyIdeaAdministrationService);
        httpServiceMock = module.get(HttpService);
    });

    describe(`initializeSoftwareToken`, () => {
        it(`should initialize a software token`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());
            httpServiceMock.post.mockReturnValueOnce(mockEmptyPostResponse());
            httpServiceMock.post.mockReturnValueOnce(mockGoogleImageResponse());

            const result: string = await service.initializeSoftwareToken(`test-user`);
            expect(result).toBe(`base64img`);
        });

        it(`should throw an error if the jwt token request causes error throw`, async () => {
            httpServiceMock.post.mockImplementationOnce(mockErrorResponse);

            await expect(service.initializeSoftwareToken(`test-user`)).rejects.toThrow(
                `Error initializing token: Error fetching JWT token: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the jwt token request causes throw`, async () => {
            httpServiceMock.post.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.initializeSoftwareToken(`test-user`)).rejects.toThrow(
                `Error initializing token: Error fetching JWT token: Unknown error occurred`,
            );
        });

        it(`should throw an error if the check user exists request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockImplementationOnce(mockErrorResponse);

            await expect(service.initializeSoftwareToken(`test-user`)).rejects.toThrow(
                `Error initializing token: Error checking user exists: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the check user exists request causes throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.initializeSoftwareToken(`test-user`)).rejects.toThrow(
                `Error initializing token: Error checking user exists: Unknown error occurred`,
            );
        });

        it(`should throw an error if the add user request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());
            httpServiceMock.post.mockImplementationOnce(mockErrorResponse);

            await expect(service.initializeSoftwareToken(`test-user`)).rejects.toThrow(
                `Error initializing token: Error adding user: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the add user exists request causes throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());
            httpServiceMock.post.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.initializeSoftwareToken(`test-user`)).rejects.toThrow(
                `Error initializing token: Error adding user: Unknown error occurred`,
            );
        });

        it(`should throw an error if the 2fa token request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());
            httpServiceMock.post.mockReturnValueOnce(mockEmptyPostResponse());
            httpServiceMock.post.mockImplementationOnce(mockErrorResponse);

            await expect(service.initializeSoftwareToken(`test-user`)).rejects.toThrow(
                `Error initializing token: Error requesting 2fa token: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the 2fa token request causes throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());
            httpServiceMock.post.mockReturnValueOnce(mockEmptyPostResponse());
            httpServiceMock.post.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.initializeSoftwareToken(`test-user`)).rejects.toThrow(
                `Error initializing token: Error requesting 2fa token: Unknown error occurred`,
            );
        });

        it(`should throw an error if getJWTToken throws a non-Error object`, async () => {
            jest.spyOn(
                service as unknown as { getJWTToken: () => Promise<string> },
                'getJWTToken',
            ).mockImplementationOnce(() => {
                // eslint-disable-next-line @typescript-eslint/no-throw-literal
                throw 'This is a non-Error throw';
            });

            await expect(service.initializeSoftwareToken(`test-user`)).rejects.toThrow(
                `Error initializing token: Unknown error occurred`,
            );
        });
    });

    describe(`getTwoAuthState`, () => {
        it(`should get the two auth state`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockTokenResponse());

            const result: PrivacyIdeaToken | undefined = await service.getTwoAuthState(`test-user`);
            expect(result).toBe(mockPrivacyIdeaToken);
        });

        it(`should return undefined user non existent`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());

            const result: PrivacyIdeaToken | undefined = await service.getTwoAuthState(`test-user`);
            expect(result).toBe(undefined);
        });

        it(`should throw an error if the two auth state request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockImplementationOnce(mockErrorResponse);

            await expect(service.getTwoAuthState(`test-user`)).rejects.toThrow(
                `Error getting two auth state: ${mockErrorMsg}`,
            );
        });

        it(`sshould throw an error if the two auth state request causes non error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.getTwoAuthState(`test-user`)).rejects.toThrow(
                `Error getting two auth state: Unknown error occurred`,
            );
        });
    });
    describe('assignHardwareToken', () => {
        it('should assign hardware token successfully', async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(of({ data: mockTokenVerificationResponse } as AxiosResponse));
            httpServiceMock.get.mockReturnValueOnce(of({ data: mockTokenOTPSerialResponse } as AxiosResponse));
            httpServiceMock.post.mockReturnValueOnce(of({ data: mockAssignTokenResponse } as AxiosResponse));

            const result: AssignTokenResponse = await service.assignHardwareToken('ABC123456', 'otp', 'test-user');
            expect(result).toEqual(mockAssignTokenResponse);
        });

        it('should throw token-not-found error', async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(
                of({ data: mockTokenVerificationResponseNotFound } as AxiosResponse),
            );

            await expect(service.assignHardwareToken('INVALID_SERIAL', 'otp', 'test-user')).rejects.toThrow(
                new TokenError(
                    'Die eingegebene Seriennummer konnte leider nicht gefunden werden. Vergewissern Sie sich bitte, das Sie eine korrekte Seriennummer eingegeben haben.',
                    'token-not-found',
                ),
            );
        });

        it('should throw token-already-assigned error', async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(
                of({ data: mockTokenVerificationResponseAlreadyAssigned } as AxiosResponse),
            );

            await expect(service.assignHardwareToken('ABC123456', 'otp', 'test-user')).rejects.toThrow(
                new TokenError(
                    'Die eingegebene Seriennummer wird bereits aktiv verwendet. Bitte überprüfen Sie ihre Eingabe und versuchen Sie es erneut.',
                    'token-already-assigned',
                ),
            );
        });

        it('should throw token-otp-not-valid error', async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(of({ data: mockTokenVerificationResponse } as AxiosResponse));
            httpServiceMock.get.mockReturnValueOnce(of({ data: mockTokenOTPSerialResponseInvalid } as AxiosResponse));

            await expect(service.assignHardwareToken('ABC123456', 'invalid-otp', 'test-user')).rejects.toThrow(
                new TokenError('Ungültiger Code. Bitte versuchen Sie es erneut.', 'token-otp-not-valid'),
            );
        });

        it('should throw general-token-error on verifyTokenStatus error', async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockImplementationOnce(() => throwError(() => new Error(mockErrorMsg)));

            await expect(service.assignHardwareToken('ABC123456', 'otp', 'test-user')).rejects.toThrow(
                new TokenError(
                    'Leider konnte ihr Hardware-Token aus technischen Gründen nicht aktiviert werden. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut. Falls das Problem bestehen bleibt, stellen Sie bitte eine Anfrage über den IQSH Helpdesk.--Link: https://www.secure-lernnetz.de/helpdesk/',
                    'general-token-error',
                ),
            );
        });

        it('should throw general-token-error on getSerialWithOTP error', async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(of({ data: mockTokenVerificationResponse } as AxiosResponse));
            httpServiceMock.get.mockImplementationOnce(() => throwError(() => new Error(mockErrorMsg)));

            await expect(service.assignHardwareToken('ABC123456', 'otp', 'test-user')).rejects.toThrow(
                new TokenError(
                    'Leider konnte ihr Hardware-Token aus technischen Gründen nicht aktiviert werden. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut. Falls das Problem bestehen bleibt, stellen Sie bitte eine Anfrage über den IQSH Helpdesk.--Link: https://www.secure-lernnetz.de/helpdesk/',
                    'general-token-error',
                ),
            );
        });

        it('should throw general-token-error on assignToken error', async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(of({ data: mockTokenVerificationResponse } as AxiosResponse));
            httpServiceMock.get.mockReturnValueOnce(of({ data: mockTokenOTPSerialResponse } as AxiosResponse));
            httpServiceMock.post.mockImplementationOnce(() => throwError(() => new Error(mockErrorMsg)));

            await expect(service.assignHardwareToken('ABC123456', 'otp', 'test-user')).rejects.toThrow(
                new TokenError(
                    'Leider konnte ihr Hardware-Token aus technischen Gründen nicht aktiviert werden. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut. Falls das Problem bestehen bleibt, stellen Sie bitte eine Anfrage über den IQSH Helpdesk.--Link: https://www.secure-lernnetz.de/helpdesk/',
                    'general-token-error',
                ),
            );
        });
    });
});
