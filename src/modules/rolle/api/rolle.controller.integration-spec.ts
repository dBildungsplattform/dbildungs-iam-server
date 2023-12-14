import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';

import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../../test/utils/index.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleMapperProfile } from '../mapper/rolle.mapper.profile.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { CreateRolleBodyParams } from './create-rolle.body.params.js';
import { RolleController } from './rolle.controller.js';
import { RolleResponse } from './rolle.response.js';

describe('Rolle API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [RolleRepo, RolleMapperProfile],
            controllers: [RolleController],
        }).compile();

        orm = module.get(MikroORM);
        em = module.get(EntityManager);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('', () => {
        expect(em).toBeDefined();
    });

    describe('/POST rolle', () => {
        it('should return created rolle', async () => {
            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: faker.string.uuid(),
            };

            const response: Response = await request(app.getHttpServer()).post('/rolle').send(params);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(expect.objectContaining(params));
        });

        it('should save rolle to db', async () => {
            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: faker.string.uuid(),
            };

            const response: Response = await request(app.getHttpServer()).post('/rolle').send(params);
            const rolle: RolleResponse = response.body as RolleResponse;

            await em.findOneOrFail(RolleEntity, { id: rolle.id });
        });
    });
});
