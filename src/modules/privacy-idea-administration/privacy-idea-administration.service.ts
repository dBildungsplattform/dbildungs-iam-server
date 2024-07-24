import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import {
    InitSoftwareTokenResponse,
    InitSoftwareTokenPayload,
    PrivacyIdeaResponseTokens,
    PrivacyIdeaToken,
    AuthenticaitonResponse,
    ResetTokenResponse,
    ResetTokenPayload,
} from './privacy-idea-api.types.js';

@Injectable()
export class PrivacyIdeaAdministrationService {
    private jwtToken: string | null = null;

    private tokenExpiry: number = 0;

    private static AUTHORIZATION_TIMEBOX_MS: number = 59 * 60 * 1000;

    public constructor(private readonly httpService: HttpService) {}

    public async initializeSoftwareToken(user: string): Promise<InitSoftwareTokenResponse> {
        const token: string = await this.getJWTToken();

        try {
            const response: InitSoftwareTokenResponse = await this.initToken(user, token);
            return response;
        } catch (error) {
            throw new Error(`Error initializing token: `);
        }
    }

    private async getJWTToken(): Promise<string> {
        const now: number = Date.now();
        if (this.jwtToken && now < this.tokenExpiry) {
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
            this.tokenExpiry = now + PrivacyIdeaAdministrationService.AUTHORIZATION_TIMEBOX_MS;
            this.jwtToken = response.data.result.value.token;
            return this.jwtToken;
        } catch (error) {
            throw new Error(`Error fetching JWT token`);
        }
    }

    public async initToken(
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
    ): Promise<InitSoftwareTokenResponse> {
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
            const response: AxiosResponse<InitSoftwareTokenResponse> = await firstValueFrom(
                this.httpService.post(url, payload, { headers }),
            );
            return response.data;
        } catch (error) {
            throw new Error(`Error initializing token: `);
        }
    }

    public async getTwoAuthState(userName: string): Promise<PrivacyIdeaToken | undefined> {
        const token: string = await this.getJWTToken();
        const endpoint: string = '/token';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = baseUrl + endpoint;
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };
        const params: { user: string; type: string } = {
            user: userName,
            type: 'totp',
        };

        try {
            const response: AxiosResponse<PrivacyIdeaResponseTokens> = await firstValueFrom(
                this.httpService.get(url, { headers: headers, params: params }),
            );
            return response.data.result.value.tokens[0];
        } catch (error) {
            throw new Error(`Error getting token: `);
        }
    }

    public async resetToken(user: string): Promise<ResetTokenResponse> {
        const token: string = await this.getJWTToken();

        const twoAuthState: PrivacyIdeaToken | undefined = await this.getTwoAuthState(user);
        if (!twoAuthState) {
            throw new Error('Error getting two-factor auth state.');
        }
        const serial: string = twoAuthState.serial;
        try {
            const response: ResetTokenResponse = await this.unassignToken(serial, token);
            return response;
        } catch (error) {
            throw new Error(`Error initializing token: `);
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
            throw new Error(`Error initializing token: `);
        }
    }
}
