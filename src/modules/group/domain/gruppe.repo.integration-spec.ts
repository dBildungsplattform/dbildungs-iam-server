import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
} from '../../../../test/utils/index.js';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { GruppenRepository } from './gruppe.repo.js';
import { Gruppe } from './gruppe.js';
import {
    Bildungsziele,
    Faecherkanon,
    GruppenTyp,
    Gruppenbereich,
    Gruppendifferenzierung,
    Gruppenoption,
    Gruppenrollen,
} from './gruppe.enums.js';
import { faker } from '@faker-js/faker';
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
import { Laufzeit } from '../persistence/laufzeit.js';
import { Referenzgruppen } from './referenzgruppen.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { GruppeMapper } from './gruppe.mapper.js';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
describe('GruppenRepository', () => {
    let module: TestingModule;
    let repo: GruppenRepository;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [GruppenRepository, GruppeMapper],
        }).compile();
        repo = module.get(GruppenRepository);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(repo).toBeDefined();
    });

    describe('createGruppe', () => {
        describe('when creating gruppe', () => {
            it('should create gruppe', async () => {
                const gruppe: Gruppe<false> = Gruppe.construct(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.lorem.word(),
                    GruppenTyp.KLASSE,
                    faker.lorem.word(),
                    faker.lorem.word(),
                    faker.lorem.word(),
                    Gruppenbereich.PFLICHT,
                    [Gruppenoption.BILINGUAL, Gruppenoption.HERKUNFTSSPRACHLICH],
                    Gruppendifferenzierung.E,
                    [Bildungsziele.GS, Bildungsziele.HS],
                    [Jahrgangsstufe.JAHRGANGSSTUFE_1, Jahrgangsstufe.JAHRGANGSSTUFE_2],
                    [Faecherkanon.DE],
                    [
                        new Referenzgruppen({
                            id: faker.string.uuid(),
                            rollen: [Gruppenrollen.LEHR],
                        }),
                    ],
                    new Laufzeit({ von: new Date(), bis: new Date() }),
                );

                const result: Gruppe<boolean> | DomainError = await repo.createGruppe(gruppe);

                expect(result).toBeDefined();
                expect(result).toBeInstanceOf(Gruppe);
                await expect(em.find(GruppeEntity, {})).resolves.toHaveLength(1);
            });
        });

        // describe('when creating gruppe with invalid data', () => {
        //     it('should return Domain error', async () => {
        //         const createGroupBodyParams: CreateGroupBodyParams = {
        //             bezeichnung: faker.lorem.word(),
        //             typ: GruppenTyp.KLASSE,
        //             bereich: Gruppenbereich.PFLICHT,
        //             differenzierung: Gruppendifferenzierung.E,
        //             bildungsziele: [],
        //             jahrgangsstufen: [],
        //             faecher: [],
        //             referenzgruppen: [],
        //             laufzeit: {},
        //         };
        //         const gruppe: Gruppe<false> = Gruppe.createGroup(createGroupBodyParams);

        //         const result: Gruppe<boolean> | DomainError = await repo.createGruppe(gruppe);

        //         expect(result).toBeDefined();
        //         expect(result).toBeInstanceOf(DomainError);
        //     });
        // });
    });
});
