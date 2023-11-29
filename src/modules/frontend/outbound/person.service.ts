import { Injectable } from '@nestjs/common';
import { BackendHttpService } from './backend-http.service.js';
import { firstValueFrom, map } from 'rxjs';
import { AxiosResponse } from 'axios/index';
import { PersonendatensatzResponse } from '../../person/api/personendatensatz.response.js';
import { PagedResponse } from '../../../shared/paging/index.js';
import { CreatePersonBodyParams } from '../../person/api/create-person.body.params.js';

@Injectable()
export class PersonService {
    public constructor(private httpService: BackendHttpService) {}

    public async getAllPersons(): Promise<PagedResponse<PersonendatensatzResponse>> {
        return firstValueFrom(
            this.httpService
                .get<PagedResponse<PersonendatensatzResponse>>(`/api/personen`)
                .pipe(map((res: AxiosResponse<PagedResponse<PersonendatensatzResponse>>) => res.data)),
        );
    }

    public async resetPassword(personId: string): Promise<string> {
        return firstValueFrom(
            this.httpService
                .patch<string>(`/api/personen/${personId}/password`)
                .pipe(map((res: AxiosResponse<string>) => res.data)),
        );
    }

    public async createPerson(params: CreatePersonBodyParams): Promise<PersonendatensatzResponse> {
        return firstValueFrom(
            this.httpService
                .post<PersonendatensatzResponse>('/api/personen', params)
                .pipe(map((res: AxiosResponse<PersonendatensatzResponse>) => res.data)),
        );
    }
}
