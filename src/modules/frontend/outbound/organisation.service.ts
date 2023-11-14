import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom, map } from 'rxjs';

import { PagedResponse } from '../../../shared/paging/paged.response.js';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';
import { User } from '../auth/index.js';
import { BackendHttpService } from './backend-http.service.js';

@Injectable()
export class OrganisationService {
    public constructor(private httpService: BackendHttpService) {}

    public getRoot(user: User): Promise<OrganisationResponse> {
        return firstValueFrom(
            this.httpService
                .get<OrganisationResponse>('/api/organisationen/root', user)
                .pipe(map((res: AxiosResponse<OrganisationResponse>) => res.data)),
        );
    }

    public findVerwaltetVon(id: string, user: User): Promise<PagedResponse<OrganisationResponse>> {
        return firstValueFrom(
            this.httpService
                .get<PagedResponse<OrganisationResponse>>(`/api/organisationen/${id}/verwaltet`, user)
                .pipe(map((res: AxiosResponse<PagedResponse<OrganisationResponse>>) => res.data)),
        );
    }

    public findZugehoerigZu(id: string, user: User): Promise<PagedResponse<OrganisationResponse>> {
        return firstValueFrom(
            this.httpService
                .get<PagedResponse<OrganisationResponse>>(`/api/organisationen/${id}/zugehoerig`, user)
                .pipe(map((res: AxiosResponse<PagedResponse<OrganisationResponse>>) => res.data)),
        );
    }

    public setVerwaltetVon(parentId: string, childId: string, user: User): Promise<void> {
        return firstValueFrom(
            this.httpService
                .post<void>(`/organisationen/${parentId}/verwaltet`, { organisationId: childId }, user)
                .pipe(map(() => undefined)),
        );
    }

    public setZugehoerigZu(parentId: string, childId: string, user: User): Promise<void> {
        return firstValueFrom(
            this.httpService
                .post<void>(`/organisationen/${parentId}/zugehoerig`, { organisationId: childId }, user)
                .pipe(map(() => undefined)),
        );
    }
}
