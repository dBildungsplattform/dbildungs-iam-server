import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

import { BackendHttpService } from './backend-http.service.js';
import { PersonService } from './person.service.js';
import { PagedResponse } from '../../../shared/paging/index.js';
import { PersonendatensatzResponse } from '../../person/api/personendatensatz.response.js';
import { faker } from '@faker-js/faker';
import { CreatePersonBodyParams } from '../../person/api/create-person.body.params.js';
import { PersonNameParams } from '../../person/api/person-name.params.js';

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

    describe('listPersons', () => {
        it('should call HttpService.get with params', async () => {
            httpServiceMock.get.mockReturnValueOnce(of({ data: [] } as AxiosResponse));
            await sut.getAllPersons();
            expect(httpServiceMock.get).toHaveBeenCalledWith('/api/personen');
        });

        it('should return response from service', async () => {
            const axiosResponse: AxiosResponse = { data: [] } as AxiosResponse;
            httpServiceMock.get.mockReturnValueOnce(of(axiosResponse));
            const result: PagedResponse<PersonendatensatzResponse> = await sut.getAllPersons();
            expect(result).toBe(axiosResponse.data);
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
            await sut.createPerson(createPersonBodyParams);
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
            );
        });

        it('should return response from service', async () => {
            const axiosResponse: AxiosResponse = { data: [] } as AxiosResponse;
            httpServiceMock.post.mockReturnValueOnce(of(axiosResponse));
            const result: PersonendatensatzResponse = await sut.createPerson(createPersonBodyParams);
            expect(result).toBe(axiosResponse.data);
        });
    });

    describe('resetPassword', () => {
        const personId: string = faker.string.numeric();
        it('should call HttpService.get with param personId', async () => {
            httpServiceMock.patch.mockReturnValueOnce(of({ data: [] } as AxiosResponse));
            await sut.resetPassword(personId);
            expect(httpServiceMock.patch).toHaveBeenCalledWith(`/api/personen/${personId}/password`);
        });

        it('should return generated password as response from service', async () => {
            const axiosResponse: AxiosResponse = { data: [] } as AxiosResponse;
            httpServiceMock.patch.mockReturnValueOnce(of(axiosResponse));
            const result: string = await sut.resetPassword(personId);
            expect(result).toBe(axiosResponse.data);
        });
    });
});
