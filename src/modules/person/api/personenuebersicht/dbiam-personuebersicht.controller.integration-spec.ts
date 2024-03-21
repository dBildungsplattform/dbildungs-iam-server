import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    MapperTestModule,
} from '../../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../../shared/validation/global-validation.pipe.js';
import { RolleFactory } from '../../../rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../../service-provider/repo/service-provider.repo.js';
import { PersonApiModule } from '../../person-api.module.js';
import { PersonRepository } from '../../persistence/person.repository.js';
import { UsernameGeneratorService } from '../../domain/username-generator.service.js';
import { createMock } from '@golevelup/ts-jest';
import { Person, PersonCreationParams } from '../../domain/person.js';
import { faker } from '@faker-js/faker';
import { DomainError } from '../../../../shared/error/index.js';
import { KeycloakUserService } from '../../../keycloak-administration/index.js';
import { DBiamPersonenuebersichtResponse } from './dbiam-personenuebersicht.response.js';

describe('Personenuebersicht API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let personRepository: PersonRepository;
    let usernameGeneratorService: UsernameGeneratorService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                PersonApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                MapperTestModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: UsernameGeneratorService,
                    useValue: createMock<UsernameGeneratorService>({
                        generateUsername: jest.fn().mockResolvedValue({ ok: true, value: 'username' }),
                    }),
                },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>({
                        create: jest.fn().mockResolvedValue({ ok: true, value: '' }),
                        setPassword: jest.fn().mockResolvedValue({ ok: true, value: '' }),
                        delete: jest.fn().mockResolvedValue({ ok: true }),
                    }),
                },
                RolleFactory,
                ServiceProviderRepo,
                PersonRepository,
            ],
        }).compile();

        orm = module.get<MikroORM>(MikroORM);
        personRepository = module.get<PersonRepository>(PersonRepository);
        usernameGeneratorService = module.get<UsernameGeneratorService>(UsernameGeneratorService);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
        jest.resetAllMocks();
    });

    describe('/GET personenuebersicht', () => {
        describe('when successfull', () => {
            describe('when no kontexts exists', () => {
                it('should return personuebersicht with zuordnungen as []', async () => {
                    const creationParams: PersonCreationParams = {
                        familienname: faker.person.lastName(),
                        vorname: faker.person.firstName(),
                    };

                    const person: Person<false> | DomainError = await Person.createNew(
                        usernameGeneratorService,
                        creationParams,
                    );
                    expect(person).not.toBeInstanceOf(DomainError);
                    if (person instanceof DomainError) {
                        return;
                    }
                    const savedPerson: Person<true> | DomainError = await personRepository.create(person);
                    expect(savedPerson).not.toBeInstanceOf(DomainError);
                    if (savedPerson instanceof DomainError) {
                        return;
                    }

                    const response: Response = await request(app.getHttpServer() as App)
                        .get(`/dbiam/personenuebersicht/${savedPerson.id}`)
                        .send();

                    expect(response.status).toBe(200);
                    expect(response.body).toBeInstanceOf(Object);
                    const responseBody: DBiamPersonenuebersichtResponse =
                        response.body as DBiamPersonenuebersichtResponse;

                    expect(responseBody?.personId).toEqual(savedPerson.id);
                    expect(responseBody?.vorname).toEqual(savedPerson.vorname);
                    expect(responseBody?.nachname).toEqual(savedPerson.familienname);
                    expect(responseBody?.benutzername).toEqual(savedPerson.referrer);
                    expect(responseBody?.zuordnungen).toEqual([]);
                });
            });
        });
    });
});
