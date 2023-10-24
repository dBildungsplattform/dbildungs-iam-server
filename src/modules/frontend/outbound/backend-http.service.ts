import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TokenSet } from 'openid-client';
import { Observable, catchError } from 'rxjs';

import { FrontendConfig } from '../../../shared/config/frontend.config.js';
import { ServerConfig } from '../../../shared/config/server.config.js';

function makeConfig(tokenSet?: TokenSet): AxiosRequestConfig {
    return {
        headers: {
            Authorization: tokenSet?.access_token && `Bearer ${tokenSet?.access_token}`,
        },
    };
}

function wrapAxiosError<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(
        catchError((err: AxiosError<string | Record<string, unknown>>): never => {
            if (err.response) {
                throw new HttpException(err.response.data, err.response.status, { cause: err });
            }

            throw new InternalServerErrorException(undefined, { cause: err });
        }),
    );
}

@Injectable()
export class BackendHttpService {
    private backend: string;

    public constructor(private httpService: HttpService, config: ConfigService<ServerConfig>) {
        this.backend = config.getOrThrow<FrontendConfig>('FRONTEND').BACKEND_ADDRESS;
    }

    public get<T>(endpoint: string, tokenSet?: TokenSet): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.get<T>(new URL(endpoint, this.backend).href, makeConfig(tokenSet)));
    }

    public post<T>(endpoint: string, data?: unknown, tokenSet?: TokenSet): Observable<AxiosResponse<T>> {
        return wrapAxiosError(
            this.httpService.post<T>(new URL(endpoint, this.backend).href, data, makeConfig(tokenSet)),
        );
    }

    public delete<T>(endpoint: string, tokenSet?: TokenSet): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.delete<T>(new URL(endpoint, this.backend).href, makeConfig(tokenSet)));
    }

    public patch<T>(endpoint: string, data?: unknown, tokenSet?: TokenSet): Observable<AxiosResponse<T>> {
        return wrapAxiosError(
            this.httpService.patch<T>(new URL(endpoint, this.backend).href, data, makeConfig(tokenSet)),
        );
    }

    public head<T>(endpoint: string, tokenSet?: TokenSet): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.head<T>(new URL(endpoint, this.backend).href, makeConfig(tokenSet)));
    }

    public put<T>(endpoint: string, data?: unknown, tokenSet?: TokenSet): Observable<AxiosResponse<T>> {
        return wrapAxiosError(
            this.httpService.put<T>(new URL(endpoint, this.backend).href, data, makeConfig(tokenSet)),
        );
    }
}
