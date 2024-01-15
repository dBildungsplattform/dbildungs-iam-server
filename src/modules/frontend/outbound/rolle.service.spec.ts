import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

import { ConfigTestModule } from '../../../../test/utils/index.js';
import { CreateRolleBodyParams } from '../../rolle/api/create-rolle.body.params.js';
import { RolleResponse } from '../../rolle/api/rolle.response.js';
import { User } from '../auth/user.decorator.js';
import { BackendHttpService } from './backend-http.service.js';
import { RolleService } from './rolle.service.js';

describe('RolleService', () => {
    let module: TestingModule;
    let sut: RolleService;
    let backendHttpService: DeepMocked<BackendHttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                RolleService,
                {
                    provide: BackendHttpService,
                    useValue: createMock<BackendHttpService>(),
                },
            ],
        }).compile();

        sut = module.get(RolleService);
        backendHttpService = module.get(BackendHttpService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('createRolle', () => {
        it('should call backend', async () => {
            const user: User = createMock<User>();
            const rolle: CreateRolleBodyParams = {
                name: faker.word.noun(),
                administeredBySchulstrukturknoten: faker.string.uuid(),
            };
            backendHttpService.post.mockReturnValueOnce(of({ data: {} } as AxiosResponse));

            await sut.createRolle(rolle, user);

            expect(backendHttpService.post).toHaveBeenCalledWith('/api/rolle', rolle, user);
        });

        it('should return response from service', async () => {
            const axiosResponse: AxiosResponse = { data: {} } as AxiosResponse;
            backendHttpService.post.mockReturnValueOnce(of(axiosResponse));

            const result: RolleResponse = await sut.createRolle(createMock(), createMock());

            expect(result).toBe(axiosResponse.data);
        });
    });
});
