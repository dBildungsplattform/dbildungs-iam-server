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
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/index.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { PersonenKontextApiModule } from '../personenkontext-api.module.js';
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

    let personRepo: PersonRepo;
    let organisationRepo: OrganisationRepo;
    let rolleRepo: RolleRepo;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MapperTestModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                PersonenKontextApiModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        }).compile();

        orm = module.get(MikroORM);
        personenkontextRepo = module.get(DBiamPersonenkontextRepo);
        personRepo = module.get(PersonRepo);
        organisationRepo = module.get(OrganisationRepo);
        rolleRepo = module.get(RolleRepo);

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
            const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const organisation: OrganisationDo<true> = await organisationRepo.save(DoFactory.createOrganisation(false));
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send({ personId: person.id, organisationId: organisation.id, rolleId: rolle.id });

            expect(response.status).toBe(201);
        });

        it('should return error if personenkontext already exists', async () => {
            const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const organisation: OrganisationDo<true> = await organisationRepo.save(DoFactory.createOrganisation(false));
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
            const personenkontext: Personenkontext<true> = await personenkontextRepo.save(
                Personenkontext.createNew(person.id, organisation.id, rolle.id),
            );

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send({
                    personId: personenkontext.personId,
                    organisationId: personenkontext.organisationId,
                    rolleId: personenkontext.rolleId,
                });

            expect(response.status).toBe(400);
        });

        it('should return error if references do not exist', async () => {
            const personenkontext: Personenkontext<false> = createPersonenkontext(false);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send({
                    personId: personenkontext.personId,
                    organisationId: personenkontext.organisationId,
                    rolleId: personenkontext.rolleId,
                });

            expect(response.status).toBe(404);
        });
    });
});
