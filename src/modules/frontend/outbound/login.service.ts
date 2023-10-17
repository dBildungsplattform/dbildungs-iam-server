import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { TokenSet } from 'openid-client';
import { Observable } from 'rxjs';
import { FrontendConfig, ServerConfig } from '../../../shared/config/index.js';

@Injectable()
export class LoginService {
    private backend: string;

    public constructor(private httpService: HttpService, config: ConfigService<ServerConfig>) {
        this.backend = config.getOrThrow<FrontendConfig>('FRONTEND').BACKEND_ADDRESS;
    }

    public login(username: string, password: string): Observable<AxiosResponse<TokenSet>> {
        return this.httpService.post<TokenSet>(`${this.backend}/api/login`, { username, password });
    }
}
