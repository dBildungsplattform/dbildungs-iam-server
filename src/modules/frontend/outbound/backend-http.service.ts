import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, catchError, map } from 'rxjs';

import { FrontendConfig, ServerConfig } from '../../../shared/config/index.js';
import { User } from '../auth/index.js';
import { PaginatedResponseDto } from '../api/paginated-data.response.js';
import { PagingHeaders } from '../../../shared/paging/paging.enums.js';

export type AxiosConfigWithoutHeaders = Omit<AxiosRequestConfig, 'headers'>;

function makeConfig(user?: User, config: AxiosConfigWithoutHeaders = {}): AxiosRequestConfig {
    return {
        ...config,
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

    public get<T>(endpoint: string, user?: User, options?: AxiosConfigWithoutHeaders): Observable<AxiosResponse<T>> {
        return wrapAxiosError(this.httpService.get<T>(new URL(endpoint, this.backend).href, makeConfig(user, options)));
    }

    public post<T>(
        endpoint: string,
        data?: unknown,
        user?: User,
        options?: AxiosConfigWithoutHeaders,
    ): Observable<AxiosResponse<T>> {
        return wrapAxiosError(
            this.httpService.post<T>(new URL(endpoint, this.backend).href, data, makeConfig(user, options)),
        );
    }

    public delete<T>(endpoint: string, user?: User, options?: AxiosConfigWithoutHeaders): Observable<AxiosResponse<T>> {
        return wrapAxiosError(
            this.httpService.delete<T>(new URL(endpoint, this.backend).href, makeConfig(user, options)),
        );
    }

    public patch<T>(
        endpoint: string,
        data?: unknown,
        user?: User,
        options?: AxiosConfigWithoutHeaders,
    ): Observable<AxiosResponse<T>> {
        return wrapAxiosError(
            this.httpService.patch<T>(new URL(endpoint, this.backend).href, data, makeConfig(user, options)),
        );
    }

    public head<T>(endpoint: string, user?: User, options?: AxiosConfigWithoutHeaders): Observable<AxiosResponse<T>> {
        return wrapAxiosError(
            this.httpService.head<T>(new URL(endpoint, this.backend).href, makeConfig(user, options)),
        );
    }

    public put<T>(
        endpoint: string,
        data?: unknown,
        user?: User,
        options?: AxiosConfigWithoutHeaders,
    ): Observable<AxiosResponse<T>> {
        return wrapAxiosError(
            this.httpService.put<T>(new URL(endpoint, this.backend).href, data, makeConfig(user, options)),
        );
    }

    public getPaginated<T>(
        endpoint: string,
        user?: User,
        options?: AxiosConfigWithoutHeaders,
    ): Observable<PaginatedResponseDto<T>> {
        return wrapAxiosError(
            this.httpService.get<T[]>(new URL(endpoint, this.backend).href, makeConfig(user, options)).pipe(
                map((response: AxiosResponse<T[]>) => {
                    const offset: number = response.headers[PagingHeaders.OFFSET.toLowerCase()] as number;
                    const limit: number = response.headers[PagingHeaders.LIMIT.toLowerCase()] as number;
                    const total: number = response.headers[PagingHeaders.TOTAL.toLowerCase()] as number;
                    return new PaginatedResponseDto<T>(offset, limit, total, response.data);
                }),
            ),
        );
    }
}
