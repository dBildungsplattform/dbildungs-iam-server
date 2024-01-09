import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';

import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationEntity } from '../../organisation/persistence/organisation.entity.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleApiModule } from '../rolle-api.module.js';
import { CreateRolleBodyParams } from './create-rolle.body.params.js';
import { RolleResponse } from './rolle.response.js';

describe('Rolle API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                RolleApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                MapperTestModule,
            ],
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

    describe('/POST rolle', () => {
        it('should return created rolle', async () => {
            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);

            await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: organisation.id,
            };

            const response: Response = await request(app.getHttpServer()).post('/rolle').send(params);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(expect.objectContaining(params));
        });

        it('should save rolle to db', async () => {
            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);

            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: organisation.id,
            };

            const response: Response = await request(app.getHttpServer()).post('/rolle').send(params);
            const rolle: RolleResponse = response.body as RolleResponse;

            await em.findOneOrFail(RolleEntity, { id: rolle.id });
        });

        it('should fail if the organisation does not exist', async () => {
            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: faker.string.uuid(),
            };

            const response: Response = await request(app.getHttpServer()).post('/rolle').send(params);

            expect(response.status).toBe(404);
        });
    });
});
