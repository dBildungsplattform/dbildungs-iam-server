import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    MapperTestModule,
    KeycloakConfigTestModule,
} from '../../../test/utils/index.js';
import { UserRepository } from './user.repository.js';
import { UserModule } from './user.module.js';
import { PersonApiModule } from '../person/person-api.module.js';
import { HttpStatus, INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import request from 'supertest';
import { EntityManager, Loaded, MikroORM } from '@mikro-orm/core';
import { PersonEntity } from '../person/persistence/person.entity.js';
import { User } from './user.js';
import { App } from 'supertest/types.js';

describe('A fully integrated user module', () => {
    let module: TestingModule;
    let app: INestApplication;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }),
                MapperTestModule,
                UserModule,
                PersonApiModule,
            ],
        }).compile();

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, 100000);

    it.only('should create users as a reaction to the create user call', async () => {
        const result: request.Response = await supertest(app.getHttpServer() as App)
            .post('/personen')
            .send({
                mandant: 'spsh',
                name: {
                    familienname: 'Mustermann',
                    vorname: 'Maximilian',
                },
                username: '',
            })
            .expect(HttpStatus.CREATED);
        expect(result.body).toMatchObject({
            person: {
                referrer: 'mmustermann',
                startpasswort: expect.stringMatching(/.{10}/) as string,
                name: {
                    vorname: 'Maximilian',
                    familienname: 'Mustermann',
                },
            },
        });

        const em: EntityManager = module.get(EntityManager);
        const userDetails: { person: { referrer: string } } = result.body as { person: { referrer: string } };
        const loadedEntity: null | Loaded<PersonEntity> = await em.findOne(PersonEntity, {
            referrer: userDetails.person.referrer,
        });
        expect(loadedEntity).not.toBeNull();

        const userRepository: UserRepository = module.get(UserRepository);
        const userPromise: Promise<User> = userRepository.loadUser(
            (loadedEntity as Loaded<PersonEntity>).keycloakUserId,
        );
        await expect(userPromise).resolves.not.toBeNull();
        const user: User = await userPromise;
        expect(user.username).toBe('mmustermann');
        expect(user.id).toBe((loadedEntity as PersonEntity).keycloakUserId);
    });

    afterAll(async () => {
        await app.close();
    });
});
