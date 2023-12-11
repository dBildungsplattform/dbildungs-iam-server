import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable, map } from 'rxjs';

import { CreateOrganisationBodyParams } from '../../organisation/api/create-organisation.body.params.js';
import { FindOrganisationQueryParams } from '../../organisation/api/find-organisation-query.param.js';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';
import { PaginatedResponseDto } from '../api/paginated-data.response.js';
import { User } from '../auth/index.js';
import { BackendHttpService } from './backend-http.service.js';

@Injectable()
export class OrganisationService {
    public constructor(private httpService: BackendHttpService) {}

    public create(organisation: CreateOrganisationBodyParams, user: User): Observable<OrganisationResponse> {
        return this.httpService
            .post<OrganisationResponse>('/api/organisationen', organisation, user)
            .pipe(map((res: AxiosResponse<OrganisationResponse>) => res.data));
    }

    public findById(id: string, user: User): Observable<OrganisationResponse> {
        return this.httpService
            .get<OrganisationResponse>(`/api/organisationen/${id}`, user)
            .pipe(map((res: AxiosResponse<OrganisationResponse>) => res.data));
    }

    public find(
        queryParams: FindOrganisationQueryParams,
        user: User,
    ): Observable<PaginatedResponseDto<OrganisationResponse>> {
        return this.httpService.getPaginated<OrganisationResponse>('/api/organisationen', user, {
            params: queryParams,
        });
    }
}
