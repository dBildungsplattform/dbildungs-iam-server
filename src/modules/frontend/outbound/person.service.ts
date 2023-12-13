import { Injectable } from '@nestjs/common';
import { BackendHttpService } from './backend-http.service.js';
import { firstValueFrom, map } from 'rxjs';
import { AxiosResponse } from 'axios/index';
import { PersonendatensatzResponse } from '../../person/api/personendatensatz.response.js';
import { CreatePersonBodyParams } from '../../person/api/create-person.body.params.js';
import { PersonenQueryParams } from '../../person/api/personen-query.param.js';
import { User } from '../auth/user.decorator.js';
import { PaginatedResponseDto } from '../api/paginated-data.response.js';
import { PersonByIdParams } from '../../person/api/person-by-id.param.js';

@Injectable()
export class PersonService {
    public constructor(private httpService: BackendHttpService) {}

    public async getPersonById(params: PersonByIdParams): Promise<PersonendatensatzResponse> {
        return firstValueFrom(
            this.httpService
                .get<PersonendatensatzResponse>(`/api/personen/${params.personId}`)
                .pipe(map((res: AxiosResponse<PersonendatensatzResponse>) => res.data)),
        );
    }

    public async getAllPersons(
        params: PersonenQueryParams,
        user: User,
    ): Promise<PaginatedResponseDto<PersonendatensatzResponse>> {
        return firstValueFrom(
            this.httpService.getPaginated<PersonendatensatzResponse>(`/api/personen`, user, { params }),
        );
    }

    public async resetPassword(personId: string, user: User): Promise<string> {
        return firstValueFrom(
            this.httpService
                .patch<string>(`/api/personen/${personId}/password`, user)
                .pipe(map((res: AxiosResponse<string>) => res.data)),
        );
    }

    public async createPerson(params: CreatePersonBodyParams, user: User): Promise<PersonendatensatzResponse> {
        return firstValueFrom(
            this.httpService
                .post<PersonendatensatzResponse>('/api/personen', params, user)
                .pipe(map((res: AxiosResponse<PersonendatensatzResponse>) => res.data)),
        );
    }
}
