import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service'; // adjust paths as necessary
import { HttpService } from '@nestjs/axios';
import { ResetTokenResponse } from './privacy-idea-api.types';
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
            post: jest.fn() // Mock the post method
          }
        }
      ],
    }).compile();

    service = module.get<PrivacyIdeaAdministrationService>(PrivacyIdeaAdministrationService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('resetToken', () => {
    it('should reset token successfully', async () => {
      const mockUser = 'testUser';
      const mockJWTToken = 'mockJWTToken';
      const mockTwoAuthState = { serial: 'mockSerial' };
      const mockResetTokenResponse: ResetTokenResponse = {
        id: 1,
        jsonrpc: "test_json",
        result: {
          status: true,
          value: 1
        },
        time: 0,
        version: "test",
        versionNumber: "test_number",
        signature: "signature"
      };

      jest.spyOn(service as any, 'getJWTToken').mockResolvedValue(mockJWTToken); // Casting to any to access private method
      jest.spyOn(service as any, 'getTwoAuthState').mockResolvedValue(mockTwoAuthState);
      jest.spyOn(service, 'unassignToken').mockResolvedValue(mockResetTokenResponse);

      const response = await service.resetToken(mockUser);
      expect(response).toEqual(mockResetTokenResponse);
      expect(service.getTwoAuthState).toHaveBeenCalledWith(mockUser);
      expect(service.unassignToken).toHaveBeenCalledWith(mockTwoAuthState.serial, mockJWTToken);
    });

    it('should throw an error if twoAuthState is not found', async () => {
      const mockUser = 'testUser';
      const mockJWTToken = 'mockJWTToken';

      jest.spyOn(service as any, 'getJWTToken').mockResolvedValue(mockJWTToken);
      jest.spyOn(service as any, 'getTwoAuthState').mockResolvedValue(null);

      await expect(service.resetToken(mockUser)).rejects.toThrow('Error getting two-factor auth state.');
    });

    it('should throw an error if unassignToken fails', async () => {
      const mockUser = 'testUser';
      const mockJWTToken = 'mockJWTToken';
      const mockTwoAuthState = { serial: 'mockSerial' };

      jest.spyOn(service as any, 'getJWTToken').mockResolvedValue(mockJWTToken);
      jest.spyOn(service as any, 'getTwoAuthState').mockResolvedValue(mockTwoAuthState);
      jest.spyOn(service, 'unassignToken').mockRejectedValue(new Error('unassignToken error'));

      await expect(service.resetToken(mockUser)).rejects.toThrow('Error initializing token: ');
    });
  });

  describe('unassignToken', () => {
    it('should unassign token successfully', async () => {
      const mockSerial = 'mockSerial';
      const mockToken = 'mockJWTToken';
      const mockResetTokenResponse: ResetTokenResponse = {
        id: 1,
        jsonrpc: "test_json",
        result: {
          status: true,
          value: 1
        },
        time: 0,
        version: "test",
        versionNumber: "test_number",
        signature: "signature"
      };
      const mockResponse: AxiosResponse<ResetTokenResponse> = {
        data: mockResetTokenResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders({ 'Content-Type': 'application/json' })
        }
      };
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const response = await service.unassignToken(mockSerial, mockToken);
      expect(response).toEqual(mockResetTokenResponse);
    });

    it('should throw an error if unassignToken fails', async () => {
      const mockSerial = 'mockSerial';
      const mockToken = 'mockJWTToken';

      jest.spyOn(httpService, 'post').mockReturnValue(throwError(new Error('unassignToken error')));

      await expect(service.unassignToken(mockSerial, mockToken)).rejects.toThrow('Error initializing token: ');
    });
  });
});
