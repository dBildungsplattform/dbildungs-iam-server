import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { Observable, of, throwError } from 'rxjs';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { PrivacyIdeaToken, User, VerificationResponse } from './privacy-idea-api.types.js';
import { AxiosError, AxiosResponse } from 'axios';

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

export const mockVerificationResponseErrorCode905: VerificationResponse = {
    detail: null,
    id: 2,
    jsonrpc: '2.0',
    result: {
        status: false,
        error: {
            code: 905,
            message: 'Specific error message for code 905',
        },
    },
    time: 1627891255,
    version: '1.0',
    signature: 'hijklmn789012',
};

export const mockJWTTokenResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: { token: `jwt-token` } } } } as AxiosResponse);

export const mockEmptyUserResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: [] } } } as AxiosResponse);

export const mockUserResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: [mockUser] } } } as AxiosResponse);

export const mockGoogleImageResponse = (): Observable<AxiosResponse> =>
    of({ data: { detail: { googleurl: { img: `base64img` } } } } as AxiosResponse);

export const mockVerificationError905Response = (): AxiosError<VerificationResponse> => {
    const error: AxiosError<VerificationResponse> = new AxiosError<VerificationResponse>(`Mock error`);
    error.response = { data: mockVerificationResponseErrorCode905 } as AxiosResponse;
    return error;
};

export const mockEmptyPostResponse = (): Observable<AxiosResponse> => of({} as AxiosResponse);

export const mockTokenResponse = (verify: boolean = false): Observable<AxiosResponse> => {
    if (verify) {
        const verifyToken: PrivacyIdeaToken = { ...mockPrivacyIdeaToken, rollout_state: 'verify' };
        return of({ data: { result: { value: { tokens: [verifyToken] } } } } as AxiosResponse);
    }
    return of({ data: { result: { value: { tokens: [mockPrivacyIdeaToken] } } } } as AxiosResponse);
};

export const mockVerficationTokenResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { status: true } } } as AxiosResponse);

export const mockErrorResponse = (): never => {
    throw new Error(mockErrorMsg);
};

export const mockNonErrorThrow = (): never => {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw { message: mockErrorMsg };
};

describe(`PrivacyIdeaAdministrationService`, () => {
    let service: PrivacyIdeaAdministrationService;
    let httpServiceMock: DeepMocked<HttpService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
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

            const result: string = await service.initializeSoftwareToken(`test-user`, false);
            expect(result).toBe(`base64img`);
        });

        it(`should initialize a software token while deleting old verify token`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockTokenResponse(true));
            httpServiceMock.delete.mockReturnValueOnce(of({} as AxiosResponse));
            httpServiceMock.post.mockReturnValueOnce(mockGoogleImageResponse());

            const result: string = await service.initializeSoftwareToken(`test-user`, false);
            expect(result).toBe(`base64img`);
        });

        it(`should throw an error if the jwt token request causes error throw`, async () => {
            httpServiceMock.post.mockImplementationOnce(mockErrorResponse);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
                `Error initializing token: Error fetching JWT token: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the jwt token request causes throw`, async () => {
            httpServiceMock.post.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
                `Error initializing token: Error fetching JWT token: Unknown error occurred`,
            );
        });

        it(`should throw an error if the check user exists request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockImplementationOnce(mockErrorResponse);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
                `Error initializing token: Error checking user exists: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the check user exists request causes throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
                `Error initializing token: Error checking user exists: Unknown error occurred`,
            );
        });

        it(`should throw an error if the add user request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());
            httpServiceMock.post.mockImplementationOnce(mockErrorResponse);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
                `Error initializing token: Error adding user: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the add user exists request causes throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());
            httpServiceMock.post.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
                `Error initializing token: Error adding user: Unknown error occurred`,
            );
        });

        it(`should throw an error if the jwt token request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockTokenResponse(true));
            httpServiceMock.delete.mockImplementationOnce(mockErrorResponse);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
                `Error initializing token: Error deleting token: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the jwt token request causes non error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockTokenResponse(true));
            httpServiceMock.delete.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
                `Error initializing token: Error deleting token: Unknown error occurred`,
            );
        });

        it(`should throw an error if the 2fa token request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());
            httpServiceMock.post.mockReturnValueOnce(mockEmptyPostResponse());
            httpServiceMock.post.mockImplementationOnce(mockErrorResponse);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
                `Error initializing token: Error requesting 2fa token: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the 2fa token request causes throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());
            httpServiceMock.post.mockReturnValueOnce(mockEmptyPostResponse());
            httpServiceMock.post.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
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

            await expect(service.initializeSoftwareToken(`test-user`, false)).rejects.toThrow(
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

        it(`should throw an error if the user token request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockImplementationOnce(mockErrorResponse);

            await expect(service.getTwoAuthState(`test-user`)).rejects.toThrow(
                `Error getting two auth state: Error getting user tokens: ${mockErrorMsg}`,
            );
        });

        it(`should throw an error if the user token request causes non error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.getTwoAuthState(`test-user`)).rejects.toThrow(
                `Error getting two auth state: Error getting user tokens: Unknown error occurred`,
            );
        });

        it(`should throw an error if the getUserTokens causes non error throw`, async () => {
            jest.spyOn(
                service as unknown as { getUserTokens: () => Promise<string> },
                'getUserTokens',
            ).mockImplementationOnce(() => {
                // eslint-disable-next-line @typescript-eslint/no-throw-literal
                throw 'This is a non-Error throw';
            });

            await expect(service.getTwoAuthState(`test-user`)).rejects.toThrow(
                `Error getting two auth state: Unknown error occurred`,
            );
        });
    });

    describe(`verifyToken`, () => {
        it(`should verify token`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockTokenResponse(true));
            httpServiceMock.post.mockReturnValueOnce(mockVerficationTokenResponse());

            const result: boolean = await service.verifyToken(`test-user`, `123456`);
            expect(result).toBe(true);
        });

        it(`should return false with wrong otp`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockTokenResponse(true));
            httpServiceMock.post.mockReturnValueOnce(throwError(() => mockVerificationError905Response()));

            const result: boolean = await service.verifyToken(`test-user`, `123456`);
            expect(result).toBe(false);
        });

        it(`should throw error when axios error occurs`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockTokenResponse(true));
            httpServiceMock.post.mockReturnValueOnce(throwError(() => new AxiosError('Mock error')));

            await expect(service.verifyToken(`test-user`, `123456`)).rejects.toThrow(
                'Error verifying token: Mock error',
            );
        });

        it(`should throw an error if there is no token to verify`, async () => {
            jest.spyOn(
                service as unknown as { getTokenToVerify: () => Promise<PrivacyIdeaToken | undefined> },
                'getTokenToVerify',
            ).mockResolvedValueOnce(undefined);

            await expect(service.verifyToken(`test-user`, `123456`)).rejects.toThrow('No token to verify');
        });

        it(`should throw an error if the verify request causes error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockTokenResponse(true));
            httpServiceMock.post.mockImplementationOnce(mockErrorResponse);

            await expect(service.verifyToken(`test-user`, `123456`)).rejects.toThrow(
                `Error verifying token: ${mockErrorMsg}`,
            );
        });

        it(`sshould throw an error if the tverify request causes non error throw`, async () => {
            httpServiceMock.post.mockReturnValueOnce(mockJWTTokenResponse());
            httpServiceMock.get.mockReturnValueOnce(mockUserResponse());
            httpServiceMock.get.mockReturnValueOnce(mockTokenResponse(true));
            httpServiceMock.post.mockImplementationOnce(mockNonErrorThrow);

            await expect(service.verifyToken(`test-user`, `123456`)).rejects.toThrow(
                `Error verifying token: Unknown error occurred`,
            );
        });
    });
});
