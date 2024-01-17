import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { firstValueFrom, of } from 'rxjs';

import { OrganisationResponse } from '../../organisation/api/organisation.response.js';
import { User } from '../auth/index.js';
import { BackendHttpService } from './backend-http.service.js';
import { OrganisationService } from './organisation.service.js';
import { CreateOrganisationBodyParams } from '../../organisation/api/create-organisation.body.params.js';
import { PaginatedResponseDto } from '../api/paginated-data.response.js';
import { FindOrganisationQueryParams } from '../../organisation/api/find-organisation-query.param.js';

describe('OrganisationService', () => {
    let module: TestingModule;
    let sut: OrganisationService;
    let httpServiceMock: DeepMocked<BackendHttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                OrganisationService,
                {
                    provide: BackendHttpService,
                    useValue: createMock<BackendHttpService>(),
                },
            ],
        }).compile();

        sut = module.get(OrganisationService);
        httpServiceMock = module.get(BackendHttpService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('create', () => {
        it('should call HttpService.post with params', async () => {
            httpServiceMock.post.mockReturnValueOnce(of({ data: {} } as AxiosResponse));
            const paramsMock: CreateOrganisationBodyParams = createMock<CreateOrganisationBodyParams>();
            const userMock: User = createMock<User>();

            await firstValueFrom(sut.create(paramsMock, userMock));

            expect(httpServiceMock.post).toHaveBeenCalledWith('/api/organisationen', paramsMock, userMock);
        });

        it('should return response data', async () => {
            const axiosResponse: AxiosResponse = { data: { id: faker.string.uuid() } } as AxiosResponse;
            httpServiceMock.post.mockReturnValueOnce(of(axiosResponse));

            const result: OrganisationResponse = await firstValueFrom(sut.create(createMock(), createMock()));

            expect(result).toBe(axiosResponse.data);
        });
    });

    describe('findById', () => {
        it('should call HttpService.get with params', async () => {
            httpServiceMock.get.mockReturnValueOnce(of({ data: {} } as AxiosResponse));
            const id: string = faker.string.uuid();
            const userMock: User = createMock<User>();

            await firstValueFrom(sut.findById(id, userMock));

            expect(httpServiceMock.get).toHaveBeenCalledWith(`/api/organisationen/${id}`, userMock);
        });

        it('should return response data', async () => {
            const axiosResponse: AxiosResponse = { data: { id: faker.string.uuid() } } as AxiosResponse;
            httpServiceMock.get.mockReturnValueOnce(of(axiosResponse));

            const result: OrganisationResponse = await firstValueFrom(sut.findById('id', createMock()));

            expect(result).toBe(axiosResponse.data);
        });
    });

    describe('find', () => {
        it('should call HttpService.getPaginated with params', async () => {
            httpServiceMock.getPaginated.mockReturnValueOnce(of(new PaginatedResponseDto(0, 1, 2, [])));
            const params: FindOrganisationQueryParams = new FindOrganisationQueryParams();
            const userMock: User = createMock<User>();

            await firstValueFrom(sut.find(params, userMock));

            expect(httpServiceMock.getPaginated).toHaveBeenCalledWith(`/api/organisationen`, userMock, { params });
        });

        it('should return response data', async () => {
            const paginatedResponse: PaginatedResponseDto<unknown> = new PaginatedResponseDto(0, 0, 0, []);
            httpServiceMock.getPaginated.mockReturnValueOnce(of(paginatedResponse));

            const result: PaginatedResponseDto<OrganisationResponse> = await firstValueFrom(
                sut.find(new FindOrganisationQueryParams(), createMock()),
            );

            expect(result).toBe(paginatedResponse);
        });
    });
});
