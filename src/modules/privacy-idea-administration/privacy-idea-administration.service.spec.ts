import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';

import { AxiosResponse } from 'axios';
import { Observable, of } from 'rxjs';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { PrivacyIdeaToken, User } from './privacy-idea-api.types.js';

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

export const mockJWTTokenResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: { token: `jwt-token` } } } } as AxiosResponse);

export const mockEmptyUserResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: [] } } } as AxiosResponse);

export const mockUserResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: [mockUser] } } } as AxiosResponse);

export const mockGoogleImageResponse = (): Observable<AxiosResponse> =>
    of({ data: { detail: { googleurl: { img: `base64img` } } } } as AxiosResponse);

export const mockEmptyPostResponse = (): Observable<AxiosResponse> => of({} as AxiosResponse);

export const mockTokenResponse = (): Observable<AxiosResponse> =>
    of({ data: { result: { value: { tokens: [mockPrivacyIdeaToken] } } } } as AxiosResponse);

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
});