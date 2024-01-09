import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom, map } from 'rxjs';

import { CreateRolleBodyParams } from '../../rolle/api/create-rolle.body.params.js';
import { RolleResponse } from '../../rolle/api/rolle.response.js';
import { User } from '../auth/index.js';
import { BackendHttpService } from './backend-http.service.js';

@Injectable()
export class RolleService {
    public constructor(private httpService: BackendHttpService) {}

    public async createRolle(params: CreateRolleBodyParams, user: User): Promise<RolleResponse> {
        return firstValueFrom(
            this.httpService
                .post<RolleResponse>('/api/rolle', params, user)
                .pipe(map((res: AxiosResponse<RolleResponse>) => res.data)),
        );
    }
}
