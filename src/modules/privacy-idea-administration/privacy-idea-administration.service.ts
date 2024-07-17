import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { InitSoftwareTokenResponse, InitSoftwareTokenPayload } from './privacy-idea-api.types.js';

@Injectable()
export class PrivacyIdeaAdministrationService {
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
        const endpoint: string = '/auth';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const authUrl: string = baseUrl + endpoint;
        const authPayload: { username: string; password: string } = {
            username: process.env['PI_ADMIN_USER'] ?? 'admin',
            password: process.env['PI_ADMIN_PASSWORD'] ?? 'admin',
        };

        try {
            const response: AxiosResponse = await firstValueFrom(
                this.httpService.post(authUrl, authPayload, {
                    headers: { 'Content-Type': 'application/json' },
                }),
            );
            return response.data.result.value.token as string;
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
}
