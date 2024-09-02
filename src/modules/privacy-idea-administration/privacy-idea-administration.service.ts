import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import {
    InitSoftwareToken,
    InitSoftwareTokenPayload,
    PrivacyIdeaResponseTokens,
    PrivacyIdeaToken,
    AuthenticaitonResponse,
    UserResponse,
    ResetTokenPayload,
    ResetTokenResponse,
    AssignTokenPayload,
    AssignTokenResponse,
    TokenOTPSerialResponse,
    TokenVerificationResponse,
} from './privacy-idea-api.types.js';
import { HardwareTokenServiceError } from './api/error/hardware-token-service.error.js';
import { SerialNotFoundError } from './api/error/serial-not-found.error.js';
import { SerialInUseError } from './api/error/serial-in-use.error.js';
import { OTPnotValidError } from './api/error/otp-not-valid.error.js';
import { ConfigService } from '@nestjs/config';
import { PrivacyIdeaConfig } from '../../shared/config/privacyidea.config.js';
import { ServerConfig } from '../../shared/config/server.config.js';
import { TokenResetError } from './api/error/token-reset.error.js';
import { TwoAuthStateError } from './api/error/two-auth-state.error.js';

@Injectable()
export class PrivacyIdeaAdministrationService {
    private jwtToken: string | null = null;

    private tokenExpiryTimestampMs: number = 0;

    private static AUTHORIZATION_TIMEBOX_MS: number = 59 * 60 * 1000;

    private readonly privacyIdeaConfig: PrivacyIdeaConfig;

    public constructor(
        private readonly httpService: HttpService,
        configService: ConfigService<ServerConfig>,
    ) {
        this.privacyIdeaConfig = configService.getOrThrow<PrivacyIdeaConfig>('PRIVACYIDEA');
    }

    public async initializeSoftwareToken(user: string): Promise<string> {
        try {
            const token: string = await this.getJWTToken();

            if (!(await this.checkUserExists(user))) {
                await this.addUser(user);
            }
            const response: InitSoftwareToken = await this.initToken(user, token);
            return response.detail.googleurl.img;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Error initializing token: ${error.message}`);
            } else {
                throw new Error(`Error initializing token: Unknown error occurred`);
            }
        }
    }

    private async getJWTToken(): Promise<string> {
        const now: number = Date.now();
        if (this.jwtToken && now < this.tokenExpiryTimestampMs) {
            return this.jwtToken;
        }

        const url: string = this.privacyIdeaConfig.ENDPOINT + '/auth';
        const authPayload: { username: string; password: string } = {
            username: this.privacyIdeaConfig.USERNAME,
            password: this.privacyIdeaConfig.PASSWORD,
        };

        try {
            const response: AxiosResponse<AuthenticaitonResponse> = await firstValueFrom(
                this.httpService.post(url, authPayload, {
                    headers: { 'Content-Type': 'application/json' },
                }),
            );
            this.tokenExpiryTimestampMs = now + PrivacyIdeaAdministrationService.AUTHORIZATION_TIMEBOX_MS;
            this.jwtToken = response.data.result.value.token;
            return this.jwtToken;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error fetching JWT token: ${error.message}`);
            } else {
                throw new Error(`Error fetching JWT token: Unknown error occurred`);
            }
        }
    }

    private async initToken(
        user: string,
        token: string,
        genkey: number = 1,
        keysize: number = 20,
        description: string = 'Description of the token',
        type: string = 'totp',
        otplen: number = 6,
        hashlib: string = 'sha1',
        twoStepInit: number = 0,
        otpkeyformat: string = 'hex',
        rollover: number = 0,
    ): Promise<InitSoftwareToken> {
        const url: string = this.privacyIdeaConfig.ENDPOINT + '/token/init';
        const headers: { Authorization: string; 'Content-Type': string } = {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
        };

        const payload: InitSoftwareTokenPayload = {
            genkey,
            keysize,
            description,
            user,
            type,
            otplen,
            hashlib,
            '2stepinit': twoStepInit,
            otpkeyformat,
            rollover,
        };

        try {
            const response: AxiosResponse<InitSoftwareToken> = await firstValueFrom(
                this.httpService.post(url, payload, { headers }),
            );
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error requesting 2fa token: ${error.message}`);
            } else {
                throw new Error(`Error requesting 2fa token: Unknown error occurred`);
            }
        }
    }

    public async getTwoAuthState(userName: string): Promise<PrivacyIdeaToken | undefined> {
        if (!(await this.checkUserExists(userName))) {
            return undefined;
        }
        const token: string = await this.getJWTToken();
        const url: string = this.privacyIdeaConfig.ENDPOINT + '/token';
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };
        const params: { user: string } = {
            user: userName,
        };
        try {
            const response: AxiosResponse<PrivacyIdeaResponseTokens> = await firstValueFrom(
                this.httpService.get(url, { headers: headers, params: params }),
            );
            return response.data.result.value.tokens[0];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error getting two auth state: ${error.message}`);
            } else {
                throw new Error(`Error getting two auth state: Unknown error occurred`);
            }
        }
    }

    private async checkUserExists(userName: string): Promise<boolean> {
        const token: string = await this.getJWTToken();
        const url: string = this.privacyIdeaConfig.ENDPOINT + '/user';
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };
        const params: { username: string } = {
            username: userName,
        };

        try {
            const response: AxiosResponse<UserResponse> = await firstValueFrom(
                this.httpService.get(url, { headers: headers, params: params }),
            );
            return response.data.result.value.length > 0;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error checking user exists: ${error.message}`);
            } else {
                throw new Error(`Error checking user exists: Unknown error occurred`);
            }
        }
    }

    private async addUser(userName: string): Promise<void> {
        const token: string = await this.getJWTToken();
        const url: string = this.privacyIdeaConfig.ENDPOINT + '/user/';
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };
        const payload: { username: string; user: string; resolver: string } = {
            username: userName,
            user: userName,
            resolver: this.privacyIdeaConfig.USER_RESOLVER,
        };

        try {
            await firstValueFrom(this.httpService.post(url, payload, { headers: headers }));
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error adding user: ${error.message}`);
            } else {
                throw new Error(`Error adding user: Unknown error occurred`);
            }
        }
    }

    private async verifyTokenStatus(serial: string, token: string): Promise<TokenVerificationResponse> {
        const url: string = this.privacyIdeaConfig.ENDPOINT + `/token?serial=${serial}`;
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };
        try {
            const response: AxiosResponse<TokenVerificationResponse> = await firstValueFrom(
                this.httpService.get(url, { headers: headers }),
            );
            return response.data;
        } catch (error) {
            throw new HardwareTokenServiceError();
        }
    }

    private async getSerialWithOTP(serial: string, otp: string, token: string): Promise<TokenOTPSerialResponse> {
        const url: string = this.privacyIdeaConfig.ENDPOINT + `/token/getserial/${otp}?unassigned=1&serial=${serial}`;
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };

        try {
            const response: AxiosResponse<TokenOTPSerialResponse> = await firstValueFrom(
                this.httpService.get(url, { headers: headers }),
            );
            return response.data;
        } catch (error) {
            throw new HardwareTokenServiceError();
        }
    }

    private async assignToken(serial: string, token: string, user: string): Promise<AssignTokenResponse> {
        const url: string = this.privacyIdeaConfig.ENDPOINT + '/token/assign';
        const realm: string = this.privacyIdeaConfig.USER_RESOLVER;
        const headers: { Authorization: string; 'Content-Type': string } = {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
        };

        const payload: AssignTokenPayload = {
            serial: serial,
            user: user,
            realm: realm,
        };

        try {
            const response: AxiosResponse<AssignTokenResponse> = await firstValueFrom(
                this.httpService.post(url, payload, { headers }),
            );
            return response.data;
        } catch (error) {
            throw new HardwareTokenServiceError();
        }
    }

    public async assignHardwareToken(serial: string, otp: string, user: string): Promise<AssignTokenResponse> {
        const token: string = await this.getJWTToken();

        if (!(await this.checkUserExists(user))) {
            await this.addUser(user);
        }
        const tokenVerificationResponse: TokenVerificationResponse = await this.verifyTokenStatus(serial, token);
        //Check token existence
        if (tokenVerificationResponse.result.value.count === 0) {
            throw new SerialNotFoundError();
        }
        //Check token assigned or not
        if (tokenVerificationResponse.result.value.tokens[0]?.username !== '') {
            throw new SerialInUseError();
        }
        //Verify otp input
        const tokenOTPserialResponse: TokenOTPSerialResponse = await this.getSerialWithOTP(serial, otp, token);
        if (tokenOTPserialResponse.result.value.serial !== serial) {
            throw new OTPnotValidError();
        }
        // Call assignToken
        return this.assignToken(serial, token, user);
    }

    public async resetToken(user: string): Promise<ResetTokenResponse> {
        const token: string = await this.getJWTToken();

        const twoAuthState: PrivacyIdeaToken | undefined = await this.getTwoAuthState(user);
        if (!twoAuthState) {
            throw new TwoAuthStateError();
        }
        const serial: string = twoAuthState.serial;
        try {
            const response: ResetTokenResponse = await this.unassignToken(serial, token);
            return response;
        } catch (error) {
            throw new TokenResetError();
        }
    }

    public async unassignToken(serial: string, token: string): Promise<ResetTokenResponse> {
        const endpoint: string = '/token/unassign';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = baseUrl + endpoint;
        const headers: { Authorization: string; 'Content-Type': string } = {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
        };

        const payload: ResetTokenPayload = {
            serial,
        };

        try {
            const response: AxiosResponse<ResetTokenResponse> = await firstValueFrom(
                this.httpService.post(url, payload, { headers }),
            );
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error unassigning token: ${error.message}`);
            } else {
                throw new Error(`Error unassigning token: Unknown error occurred`);
            }
        }
    }
}
