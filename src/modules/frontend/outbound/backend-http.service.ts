import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, catchError } from 'rxjs';

import { FrontendConfig, ServerConfig } from '../../../shared/config/index.js';
import { User } from '../auth/index.js';

function makeConfig(user?: User): AxiosRequestConfig {
    return {
        headers: {
            Authorization: user?.access_token && `Bearer ${user?.access_token}`,
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

    public constructor(
        private httpService: HttpService,
        config: ConfigService<ServerConfig>,
    ) {
        this.backend = config.getOrThrow<FrontendConfig>('FRONTEND').BACKEND_ADDRESS;
    }

    public get<T>(endpoint: string, user?: User): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.get<T>(new URL(endpoint, this.backend).href, makeConfig(user)));
    }

    public post<T>(endpoint: string, data?: unknown, user?: User): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.post<T>(new URL(endpoint, this.backend).href, data, makeConfig(user)));
    }

    public delete<T>(endpoint: string, user?: User): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.delete<T>(new URL(endpoint, this.backend).href, makeConfig(user)));
    }

    public patch<T>(endpoint: string, data?: unknown, user?: User): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.patch<T>(new URL(endpoint, this.backend).href, data, makeConfig(user)));
    }

    public head<T>(endpoint: string, user?: User): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.head<T>(new URL(endpoint, this.backend).href, makeConfig(user)));
    }

    public put<T>(endpoint: string, data?: unknown, user?: User): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.put<T>(new URL(endpoint, this.backend).href, data, makeConfig(user)));
    }
}
