import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, lastValueFrom, of } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import {
    InitSoftwareToken,
    InitSoftwareTokenPayload,
    PrivacyIdeaResponseTokens,
    PrivacyIdeaToken,
    AuthenticaitonResponse,
    UserResponse,
    VerificationResponse,
} from './privacy-idea-api.types.js';

@Injectable()
export class PrivacyIdeaAdministrationService {
    private jwtToken: string | null = null;

    private tokenExpiryTimestampMs: number = 0;

    private static AUTHORIZATION_TIMEBOX_MS: number = 59 * 60 * 1000;

    public constructor(private readonly httpService: HttpService) {}

    public async initializeSoftwareToken(user: string, selfService: boolean): Promise<string> {
        try {
            const token: string = await this.getJWTToken();

            if (!(await this.checkUserExists(user))) {
                await this.addUser(user);
            } else {
                const tokenToVerify: PrivacyIdeaToken | undefined = await this.getTokenToVerify(user);
                if (tokenToVerify) {
                    await this.deleteToken(tokenToVerify.serial);
                }
            }
            const response: InitSoftwareToken = await this.initToken(user, token, selfService);
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
        selfService: boolean = false,
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
        const headers: { Authorization: string; 'Content-Type': string; SelfService: string } = {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
            SelfService: selfService.toString(),
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
        try {
            return (await this.getUserTokens(userName)).filter(
                (x: PrivacyIdeaToken) => x.rollout_state !== 'verify',
            )[0];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error getting two auth state: ${error.message}`);
            } else {
                throw new Error(`Error getting two auth state: Unknown error occurred`);
            }
        }
    }

    private async getUserTokens(userName: string): Promise<PrivacyIdeaToken[]> {
        if (!(await this.checkUserExists(userName))) {
            return [];
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
            return response.data.result.value.tokens;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error getting user tokens: ${error.message}`);
            } else {
                throw new Error(`Error getting user tokens: Unknown error occurred`);
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

    public async verifyToken(userName: string, otp: string): Promise<boolean> {
        const tokenToVerify: PrivacyIdeaToken | undefined = await this.getTokenToVerify(userName);
        if (!tokenToVerify) {
            throw new Error('No token to verify');
        }
        const token: string = await this.getJWTToken();
        const endpoint: string = '/token/init';
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = baseUrl + endpoint;
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };
        const payload: { serial: string; verify: string } = {
            serial: tokenToVerify.serial,
            verify: otp,
        };

        try {
            const response: AxiosResponse<VerificationResponse> | null = await lastValueFrom(
                this.httpService.post(url, payload, { headers: headers }).pipe(
                    catchError((error: AxiosError<VerificationResponse>) => {
                        if (error.response?.data.result.error?.code == 905) {
                            return of(null);
                        }
                        throw new Error(`Error verifying token:`);
                    }),
                ),
            );
            return response ? response.data.result.status : false;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error verifying token: ${error.message}`);
            } else {
                throw new Error(`Error verifying token: Unknown error occurred`);
            }
        }
    }

    private async getTokenToVerify(userName: string): Promise<PrivacyIdeaToken | undefined> {
        try {
            return (await this.getUserTokens(userName)).filter((x: PrivacyIdeaToken) => x.rollout_state == 'verify')[0];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error getting two auth state: ${error.message}`);
            } else {
                throw new Error(`Error getting two auth state: Unknown error occurred`);
            }
        }
    }

    private async deleteToken(serial: string): Promise<void> {
        const token: string = await this.getJWTToken();
        const endpoint: string = '/token/' + serial;
        const baseUrl: string = process.env['PI_BASE_URL'] ?? 'http://localhost:5000';
        const url: string = baseUrl + endpoint;
        const headers: { Authorization: string } = {
            Authorization: `${token}`,
        };

        try {
            await firstValueFrom(this.httpService.delete(url, { headers: headers }));
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error deleting token: ${error.message}`);
            } else {
                throw new Error(`Error deleting token: Unknown error occurred`);
            }
        }
    }
}
