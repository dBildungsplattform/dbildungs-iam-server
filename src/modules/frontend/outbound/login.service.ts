import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { TokenSet } from 'openid-client';
import { Observable } from 'rxjs';

import { BackendHttpService } from './backend-http.service.js';

@Injectable()
export class LoginService {
    public constructor(private httpService: BackendHttpService) {}

    public login(username: string, password: string): Observable<AxiosResponse<TokenSet>> {
        return this.httpService.post<TokenSet>('/api/login', { username, password });
    }
}
