import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js'; // adjust paths as necessary
import { HttpService } from '@nestjs/axios';
import { ResetTokenPayload, ResetTokenResponse } from './privacy-idea-api.types.js';
import { AxiosHeaders, AxiosResponse } from 'axios';

jest.mock('axios'); // Mock axios globally

describe('PrivacyIdeaAdministrationService', () => {
    let service: PrivacyIdeaAdministrationService;
    let httpService: HttpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PrivacyIdeaAdministrationService,
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn(), // Mock the post method
                    },
                },
            ],
        }).compile();

        service = module.get<PrivacyIdeaAdministrationService>(PrivacyIdeaAdministrationService);
        httpService = module.get<HttpService>(HttpService);
    });

    describe('resetToken', () => {
        it('should reset token successfully', async () => {
            const mockUser: string = 'testUser';
            const mockJWTToken: string = 'mockJWTToken';
            const mockTwoAuthState: ResetTokenPayload = { serial: 'mockSerial' };
            const mockResetTokenResponse: ResetTokenResponse = {
                id: 1,
                jsonrpc: 'test_json',
                result: {
                    status: true,
                    value: 1,
                },
                time: 0,
                version: 'test',
                versionNumber: 'test_number',
                signature: 'signature',
            };

            jest.spyOn(service as unknown as { getJWTToken: () => Promise<string> }, 'getJWTToken').mockResolvedValue(
                mockJWTToken,
            );
            jest.spyOn(
                service as unknown as { getTwoAuthState: (user: string) => Promise<ResetTokenPayload | null> },
                'getTwoAuthState',
            ).mockResolvedValue(mockTwoAuthState);
            jest.spyOn(
                service as unknown as { unassignToken: (serial: string, token: string) => Promise<ResetTokenResponse> },
                'unassignToken',
            ).mockResolvedValue(mockResetTokenResponse);

            const response: ResetTokenResponse = await service.resetToken(mockUser);
            expect(response).toEqual(mockResetTokenResponse);
            expect(service.getTwoAuthState).toHaveBeenCalledWith(mockUser);
            expect(service.unassignToken).toHaveBeenCalledWith(mockTwoAuthState.serial, mockJWTToken);
        });

        it('should throw an error if twoAuthState is not found', async () => {
            const mockUser: string = 'testUser';
            const mockJWTToken: string = 'mockJWTToken';

            jest.spyOn(service as unknown as { getJWTToken: () => Promise<string> }, 'getJWTToken').mockResolvedValue(
                mockJWTToken,
            );
            jest.spyOn(
                service as unknown as { getTwoAuthState: (user: string) => Promise<ResetTokenPayload | null> },
                'getTwoAuthState',
            ).mockResolvedValue(null);

            await expect(service.resetToken(mockUser)).rejects.toThrow('Error getting two-factor auth state.');
        });

        it('should throw an error if unassignToken fails', async () => {
            const mockUser: string = 'testUser';
            const mockJWTToken: string = 'mockJWTToken';
            const mockTwoAuthState: ResetTokenPayload = { serial: 'mockSerial' };

            jest.spyOn(service as unknown as { getJWTToken: () => Promise<string> }, 'getJWTToken').mockResolvedValue(
                mockJWTToken,
            );
            jest.spyOn(
                service as unknown as { getTwoAuthState: (user: string) => Promise<ResetTokenPayload | null> },
                'getTwoAuthState',
            ).mockResolvedValue(mockTwoAuthState);
            jest.spyOn(service, 'unassignToken').mockRejectedValue(new Error('unassignToken error'));

            await expect(service.resetToken(mockUser)).rejects.toThrow('Error initializing token: ');
        });
    });

    describe('unassignToken', () => {
        it('should unassign token successfully', async () => {
            const mockSerial: string = 'mockSerial';
            const mockToken: string = 'mockJWTToken';
            const mockResetTokenResponse: ResetTokenResponse = {
                id: 1,
                jsonrpc: 'test_json',
                result: {
                    status: true,
                    value: 1,
                },
                time: 0,
                version: 'test',
                versionNumber: 'test_number',
                signature: 'signature',
            };
            const mockResponse: AxiosResponse<ResetTokenResponse> = {
                data: mockResetTokenResponse,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {
                    headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
                },
            };
            jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

            const response: ResetTokenResponse = await service.unassignToken(mockSerial, mockToken);
            expect(response).toEqual(mockResetTokenResponse);
        });

        it('should throw an error if unassignToken fails', async () => {
            const mockSerial: string = 'mockSerial';
            const mockToken: string = 'mockJWTToken';

            jest.spyOn(httpService, 'post').mockReturnValue(throwError(new Error('unassignToken error')));

            await expect(service.unassignToken(mockSerial, mockToken)).rejects.toThrow('Error initializing token: ');
        });
    });
});
