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
    ResetTokenResponse,
    ResetTokenPayload,
    TokenOTPSerialResponse,
    AssignTokenResponse,
    AssignTokenPayload,
    TokenVerificationResponse,
    UserResponse,
} from './privacy-idea-api.types.js';
import { TokenError } from './api/errors/token-error.js';

@Injectable()
export class PrivacyIdeaAdministrationService {
    private jwtToken: string | null = null;

    private tokenExpiryTimestampMs: number = 0;

    private static AUTHORIZATION_TIMEBOX_MS: number = 59 * 60 * 1000;

    public constructor(private readonly httpService: HttpService) {}

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

        const endpoint: string = '/auth';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const authUrl: string = baseUrl + endpoint;
        const authPayload: { username: string; password: string } = {
            username: process.env['PI_ADMIN_USER'] ?? 'admin',
            password: process.env['PI_ADMIN_PASSWORD'] ?? 'admin',
        };

        try {
            const response: AxiosResponse<AuthenticaitonResponse> = await firstValueFrom(
                this.httpService.post(authUrl, authPayload, {
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
        const endpoint: string = '/token/init';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = baseUrl + endpoint;
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
        const endpoint: string = '/token';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = baseUrl + endpoint;
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
        const endpoint: string = '/user';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = baseUrl + endpoint;
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
        const endpoint: string = '/user/';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const resolver: string = process.env['PI_USER_RESOLVER'] ?? 'deflocal';
        const url: string = baseUrl + endpoint;
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };
        const payload: { username: string; user: string; resolver: string } = {
            username: userName,
            user: userName,
            resolver: resolver,
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
        const endpoint: string = `/token?serial=${serial}`;
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = `${baseUrl}${endpoint}`;
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };
        try {
            const response: AxiosResponse<TokenVerificationResponse> = await firstValueFrom(
                this.httpService.get(url, { headers: headers }),
            );
            return response.data;
        } catch (error) {
            throw new TokenError(
                'Leider konnte ihr Hardware-Token aus technischen Gründen nicht aktiviert werden. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut. Falls das Problem bestehen bleibt, stellen Sie bitte eine Anfrage über den IQSH Helpdesk.--Link: https://www.secure-lernnetz.de/helpdesk/',
                'general-token-error',
            );
        }
    }

    private async getSerialWithOTP(otp: string, token: string): Promise<TokenOTPSerialResponse> {
        const endpoint: string = `/token/getserial/${otp}?unassigned=1`;
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = `${baseUrl}${endpoint}`;
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };

        try {
            const response: AxiosResponse<TokenOTPSerialResponse> = await firstValueFrom(
                this.httpService.get(url, { headers: headers }),
            );
            return response.data;
        } catch (error) {
            throw new TokenError(
                'Leider konnte ihr Hardware-Token aus technischen Gründen nicht aktiviert werden. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut. Falls das Problem bestehen bleibt, stellen Sie bitte eine Anfrage über den IQSH Helpdesk.--Link: https://www.secure-lernnetz.de/helpdesk/',
                'general-token-error',
            );
        }
    }

    private async assignToken(serial: string, token: string, user: string): Promise<AssignTokenResponse> {
        const endpoint: string = '/token/assign';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = baseUrl + endpoint;
        const headers: { Authorization: string; 'Content-Type': string } = {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
        };

        const payload: AssignTokenPayload = {
            serial,
            user: user,
            realm: 'defrealm',
        };

        try {
            const response: AxiosResponse<AssignTokenResponse> = await firstValueFrom(
                this.httpService.post(url, payload, { headers }),
            );
            return response.data;
        } catch (error) {
            throw new TokenError(
                'Leider konnte ihr Hardware-Token aus technischen Gründen nicht aktiviert werden. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut. Falls das Problem bestehen bleibt, stellen Sie bitte eine Anfrage über den IQSH Helpdesk.--Link: https://www.secure-lernnetz.de/helpdesk/',
                'general-token-error',
            );
        }
    }

    public async assignHardwareToken(serial: string, otp: string, user: string): Promise<AssignTokenResponse> {
        const token: string = await this.getJWTToken();
        const tokenVerificationResponse: TokenVerificationResponse = await this.verifyTokenStatus(serial, token);
        //Check token existence
        if (tokenVerificationResponse.result.value.count === 0) {
            throw new TokenError(
                'Die eingegebene Seriennummer konnte leider nicht gefunden werden. Vergewissern Sie sich bitte, das Sie eine korrekte Seriennummer eingegeben haben.',
                'token-not-found',
            );
        }
        //Check token assigned or not
        if (tokenVerificationResponse.result.value.tokens[0]?.username !== '') {
            throw new TokenError(
                'Die eingegebene Seriennummer wird bereits aktiv verwendet. Bitte überprüfen Sie ihre Eingabe und versuchen Sie es erneut.',
                'token-already-assigned',
            );
        }
        //Verify otp input
        const tokenOTPserialResponse: TokenOTPSerialResponse = await this.getSerialWithOTP(otp, token);
        if (tokenOTPserialResponse.result.value.serial !== serial) {
            throw new TokenError('Ungültiger Code. Bitte versuchen Sie es erneut.', 'token-otp-not-valid');
        }
        // Call assignToken
        return this.assignToken(serial, token, user);
    }
}
