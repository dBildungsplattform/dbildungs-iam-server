import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

import { OrganisationResponse } from '../../organisation/api/organisation.response.js';
import { User } from '../auth/index.js';
import { BackendHttpService } from './backend-http.service.js';
import { OrganisationService } from './organisation.service.js';

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

    describe('getRoot', () => {
        it('should call HttpService.get with params', async () => {
            httpServiceMock.get.mockReturnValueOnce(of({ data: {} } as AxiosResponse));
            const userMock: User = createMock<User>();

            await sut.getRoot(userMock);

            expect(httpServiceMock.get).toHaveBeenCalledWith('/api/organisationen/root', userMock);
        });

        it('should return response data', async () => {
            const axiosResponse: AxiosResponse = { data: { id: faker.string.uuid() } } as AxiosResponse;
            httpServiceMock.get.mockReturnValueOnce(of(axiosResponse));

            const result: OrganisationResponse = await sut.getRoot(createMock());

            expect(result).toBe(axiosResponse.data);
        });
    });

    describe('findVerwaltetVon', () => {
        it('should call HttpService.get with params', async () => {
            httpServiceMock.get.mockReturnValueOnce(of({ data: [] } as AxiosResponse));
            const orgId: string = faker.string.uuid();
            const userMock: User = createMock<User>();

            await sut.findVerwaltetVon(orgId, userMock);

            expect(httpServiceMock.get).toHaveBeenCalledWith(`/api/organisationen/${orgId}/verwaltet`, userMock);
        });

        it('should return response data', async () => {
            const axiosResponse: AxiosResponse = { data: [{ id: faker.string.uuid() }] } as AxiosResponse;
            httpServiceMock.get.mockReturnValueOnce(of(axiosResponse));

            const result: OrganisationResponse[] = await sut.findVerwaltetVon(faker.string.uuid(), createMock());

            expect(result).toBe(axiosResponse.data);
        });
    });

    describe('findZugehoerigZu', () => {
        it('should call HttpService.get with params', async () => {
            httpServiceMock.get.mockReturnValueOnce(of({ data: [] } as AxiosResponse));
            const orgId: string = faker.string.uuid();
            const userMock: User = createMock<User>();

            await sut.findZugehoerigZu(orgId, userMock);

            expect(httpServiceMock.get).toHaveBeenCalledWith(`/api/organisationen/${orgId}/zugehoerig`, userMock);
        });

        it('should return response data', async () => {
            const axiosResponse: AxiosResponse = { data: [{ id: faker.string.uuid() }] } as AxiosResponse;
            httpServiceMock.get.mockReturnValueOnce(of(axiosResponse));

            const result: OrganisationResponse[] = await sut.findZugehoerigZu(faker.string.uuid(), createMock());

            expect(result).toBe(axiosResponse.data);
        });
    });

    describe('setVerwaltetVon', () => {
        it('should call HttpService.post with params', async () => {
            httpServiceMock.post.mockReturnValueOnce(of({} as AxiosResponse));
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            const userMock: User = createMock<User>();

            await sut.setVerwaltetVon(parentId, childId, userMock);

            expect(httpServiceMock.post).toHaveBeenCalledWith(
                `/api/organisationen/${parentId}/verwaltet`,
                { organisationId: childId },
                userMock,
            );
        });
    });

    describe('setZugehoerigZu', () => {
        it('should call HttpService.post with params', async () => {
            httpServiceMock.post.mockReturnValueOnce(of({} as AxiosResponse));
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            const userMock: User = createMock<User>();

            await sut.setZugehoerigZu(parentId, childId, userMock);

            expect(httpServiceMock.post).toHaveBeenCalledWith(
                `/api/organisationen/${parentId}/zugehoerig`,
                { organisationId: childId },
                userMock,
            );
        });
    });
});
