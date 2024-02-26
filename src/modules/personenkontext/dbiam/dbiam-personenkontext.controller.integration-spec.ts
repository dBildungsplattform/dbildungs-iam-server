import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/index.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamPersonenkontextController } from './dbiam-personenkontext.controller.js';
import { DBiamPersonenkontextRepo } from './dbiam-personenkontext.repo.js';

function createPersonenkontext<WasPersisted extends boolean>(
    this: void,
    withId: WasPersisted,
    params: Partial<Personenkontext<boolean>> = {},
): Personenkontext<WasPersisted> {
    const personenkontext: Personenkontext<WasPersisted> = Personenkontext.construct<boolean>(
        withId ? faker.string.uuid() : undefined,
        withId ? faker.date.past() : undefined,
        withId ? faker.date.recent() : undefined,
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
    );

    Object.assign(personenkontext, params);

    return personenkontext;
}

describe('dbiam Personenkontext API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let personenkontextRepo: DBiamPersonenkontextRepo;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            controllers: [DBiamPersonenkontextController],
            providers: [
                DBiamPersonenkontextRepo,
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        }).compile();

        orm = module.get(MikroORM);
        personenkontextRepo = module.get(DBiamPersonenkontextRepo);

        await DatabaseTestModule.setupDatabase(orm);
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('/GET personenkontexte for person', () => {
        it('should return all personenkontexte for the person', async () => {
            await Promise.all([
                personenkontextRepo.save(createPersonenkontext(false, { personId: '0' })),
                personenkontextRepo.save(createPersonenkontext(false, { personId: '0' })),
                personenkontextRepo.save(createPersonenkontext(false, { personId: '1' })),
            ]);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/dbiam/personenkontext/0')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(2);
        });

        it('should return empty list', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get('/dbiam/personenkontext/0')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(0);
        });
    });

    describe('/POST create personenkontext', () => {
        it('should return created personenkontext', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send({ personId: '0', organisationId: '1', rolleId: '3' });

            expect(response.status).toBe(201);
        });

        it('should return error if personenkontext already exists', async () => {
            const personenkontext: Personenkontext<true> = await personenkontextRepo.save(createPersonenkontext(false));

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send({
                    personId: personenkontext.personId,
                    organisationId: personenkontext.organisationId,
                    rolleId: personenkontext.rolleId,
                });

            expect(response.status).toBe(400);
        });
    });
});
