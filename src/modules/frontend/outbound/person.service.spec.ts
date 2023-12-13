import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

import { BackendHttpService } from './backend-http.service.js';
import { PersonService } from './person.service.js';
import { PersonendatensatzResponse } from '../../person/api/personendatensatz.response.js';
import { faker } from '@faker-js/faker';
import { CreatePersonBodyParams } from '../../person/api/create-person.body.params.js';
import { PersonNameParams } from '../../person/api/person-name.params.js';
import { PaginatedResponseDto } from '../api/paginated-data.response.js';
import { User } from '../auth/user.decorator.js';
import { PersonenQueryParams } from '../../person/api/personen-query.param.js';
import { PersonByIdParams } from '../../person/api/person-by-id.param.js';

describe('PersonService', () => {
    let module: TestingModule;
    let sut: PersonService;
    let httpServiceMock: DeepMocked<BackendHttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonService,
                {
                    provide: BackendHttpService,
                    useValue: createMock<BackendHttpService>(),
                },
            ],
        }).compile();

        sut = module.get(PersonService);
        httpServiceMock = module.get(BackendHttpService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('getPersonById', () => {
        const personId: string = '1';

        it('should call HttpService.get with params', async () => {
            httpServiceMock.get.mockReturnValueOnce(of({ data: [] } as AxiosResponse));
            const queryParams: PersonByIdParams = {
                personId: personId,
            };
            await sut.getPersonById(queryParams);
            expect(httpServiceMock.get).toHaveBeenCalledWith(`/api/personen/${personId}`);
        });

        it('should return response from service', async () => {
            const personResponse: PersonendatensatzResponse = new PersonendatensatzResponse();
            httpServiceMock.get.mockReturnValueOnce(of({ data: personResponse } as AxiosResponse));
            const result: PersonendatensatzResponse = await sut.getPersonById({ personId: personId });
            expect(result).toBe(personResponse);
        });
    });

    describe('getAllPersons', () => {
        it('should call HttpService.get with params', async () => {
            httpServiceMock.getPaginated.mockReturnValueOnce(of(new PaginatedResponseDto(0, 0, 0, [])));
            const userMock: User = createMock<User>();
            const queryParams: PersonenQueryParams = new PersonenQueryParams();
            await sut.getAllPersons(queryParams, userMock);
            expect(httpServiceMock.getPaginated).toHaveBeenCalledWith('/api/personen', userMock, {
                params: queryParams,
            });
        });

        it('should return response from service', async () => {
            const paginatedResponse: PaginatedResponseDto<unknown> = new PaginatedResponseDto(0, 0, 0, []);
            httpServiceMock.getPaginated.mockReturnValueOnce(of(paginatedResponse));
            const result: PaginatedResponseDto<PersonendatensatzResponse> = await sut.getAllPersons(
                new PersonenQueryParams(),
                createMock(),
            );
            expect(result).toBe(paginatedResponse);
        });
    });

    describe('createPerson', () => {
        const personNameParams: PersonNameParams = {
            familienname: faker.person.lastName(),
            vorname: faker.person.firstName(),
        };
        const createPersonBodyParams: CreatePersonBodyParams = {
            username: faker.string.alpha(),
            mandant: faker.string.alpha(),
            name: personNameParams,
        };
        it('should call HttpService.post with params', async () => {
            httpServiceMock.post.mockReturnValueOnce(of({ data: createPersonBodyParams } as AxiosResponse));
            const userMock: User = createMock<User>();
            await sut.createPerson(createPersonBodyParams, userMock);
            expect(httpServiceMock.post).toHaveBeenCalledWith(
                '/api/personen',
                expect.objectContaining({
                    mandant: expect.any(String) as string,
                    username: expect.any(String) as string,
                    name: expect.objectContaining({
                        familienname: expect.any(String) as string,
                        vorname: expect.any(String) as string,
                    }) as PersonNameParams,
                }),
                userMock,
            );
        });

        it('should return response from service', async () => {
            const axiosResponse: AxiosResponse = { data: [] } as AxiosResponse;
            httpServiceMock.post.mockReturnValueOnce(of(axiosResponse));
            const result: PersonendatensatzResponse = await sut.createPerson(createPersonBodyParams, createMock());
            expect(result).toBe(axiosResponse.data);
        });
    });

    describe('resetPassword', () => {
        const personId: string = faker.string.numeric();
        it('should call HttpService.get with param personId', async () => {
            httpServiceMock.patch.mockReturnValueOnce(of({ data: [] } as AxiosResponse));
            const userMock: User = createMock<User>();
            await sut.resetPassword(personId, userMock);
            expect(httpServiceMock.patch).toHaveBeenCalledWith(`/api/personen/${personId}/password`, userMock);
        });

        it('should return generated password as response from service', async () => {
            const axiosResponse: AxiosResponse = { data: [] } as AxiosResponse;
            httpServiceMock.patch.mockReturnValueOnce(of(axiosResponse));
            const result: string = await sut.resetPassword(personId, createMock());
            expect(result).toBe(axiosResponse.data);
        });
    });
});
