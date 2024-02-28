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
import { GruppeEntity } from '../persistence/gruppe.entity.js';
describe('GruppenRepository', () => {
    let module: TestingModule;
    let repo: GruppenRepository;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [GruppenRepository],
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

    const gruppe: Gruppe = Gruppe.construct(
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

    const gruppeEntity: GruppeEntity = new GruppeEntity();
    gruppeEntity.mandant = faker.string.uuid();
    gruppeEntity.organisationId = faker.string.uuid();
    gruppeEntity.bezeichnung = gruppe.getBezeichnung();
    gruppeEntity.typ = gruppe.getTyp();
    gruppeEntity.bereich = gruppe.getBereich();
    gruppeEntity.differenzierung = gruppe.getDifferenzierung();
    gruppeEntity.bildungsziele = gruppe.getBildungsziele();
    gruppeEntity.jahrgangsstufen = gruppe.getJahrgangsstufen();
    gruppeEntity.faecher = gruppe.getFaecher();
    gruppeEntity.referenzgruppen = gruppe.getReferenzgruppen();
    gruppeEntity.laufzeit = gruppe.getLaufzeit();

    describe('createGruppe', () => {
        describe('when creating a gruppe', () => {
            it('should create gruppe', async () => {
                const result: Result<GruppeEntity, DomainError> = await repo.createGruppe(gruppeEntity);

                expect(result).toBeDefined();
                await expect(em.find(GruppeEntity, {})).resolves.toHaveLength(1);
            });
        });
    });
});
