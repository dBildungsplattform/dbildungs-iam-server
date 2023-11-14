import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom, map } from 'rxjs';

import { GetServiceProviderInfoDo } from '../../rolle/domain/get-service-provider-info.do.js';
import { User } from '../auth/user.decorator.js';
import { BackendHttpService } from './backend-http.service.js';

@Injectable()
export class ProviderService {
    public constructor(private httpService: BackendHttpService) {}

    public async listProviders(user: User): Promise<GetServiceProviderInfoDo[]> {
        return firstValueFrom(
            this.httpService
                .get<GetServiceProviderInfoDo[]>('/api/provider', user)
                .pipe(map((res: AxiosResponse<GetServiceProviderInfoDo[]>) => res.data)),
        );
    }
}
