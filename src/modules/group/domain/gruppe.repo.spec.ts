import { faker } from '@faker-js/faker';
import { DomainError } from '../../../shared/error/domain.error.js';
import { GruppenTyp, Gruppenbereich, Gruppendifferenzierung, Gruppenoption } from './gruppe.enums.js';
import { Gruppe } from './gruppe.js';
import { EntityManager } from '@mikro-orm/postgresql';
import { TestingModule, Test } from '@nestjs/testing';
import { GruppenRepository } from './gruppe.repo.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { ConfigTestModule } from '../../../../test/utils/index.js';
import { GruppeMapper } from './gruppe.mapper.js';

describe('GruppeRepo', () => {
    let module: TestingModule;
    let repo: GruppenRepository;
    let mapper: DeepMocked<GruppeMapper>;
    let em: DeepMocked<EntityManager>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                GruppenRepository,
                {
                    provide: EntityManager,
                    useValue: createMock<EntityManager>(),
                },
                {
                    provide: GruppeMapper,
                    useValue: createMock<GruppeMapper>(),
                },
            ],
        }).compile();
        repo = module.get(GruppenRepository);
        em = module.get(EntityManager);
        mapper = module.get(GruppeMapper);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('when creating a group with invalid data', () => {
        it('should return Domain error', async () => {
            const gruppe: Gruppe<false> = Gruppe.construct(
                faker.string.uuid(),
                faker.date.recent(),
                faker.date.recent(),
                faker.lorem.word(),
                GruppenTyp.KURS,
                faker.lorem.word(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.lorem.word(),
                Gruppenbereich.PFLICHT,
                [Gruppenoption.BILINGUAL],
                Gruppendifferenzierung.E,
                [],
                [],
                [],
                [],
            );

            const gruppeEntity: GruppeEntity = new GruppeEntity();
            gruppeEntity.mandant = gruppe.mandant;
            gruppeEntity.organisationId = gruppe.organisationId;
            gruppeEntity.bezeichnung = gruppe.bezeichnung;
            gruppeEntity.typ = gruppe.typ;
            gruppeEntity.bereich = gruppe.bereich;
            gruppeEntity.differenzierung = gruppe.differenzierung;
            gruppeEntity.bildungsziele = gruppe.bildungsziele;
            gruppeEntity.jahrgangsstufen = gruppe.jahrgangsstufen;
            gruppeEntity.faecher = gruppe.faecher;
            gruppeEntity.referenzgruppen = gruppe.referenzgruppen;
            gruppeEntity.laufzeit = gruppe.laufzeit;

            mapper.mapGruppeToGruppeEntity.mockReturnValue(gruppeEntity);
            em.persistAndFlush.mockRejectedValue(new Error('Error'));

            const result: Result<Gruppe<true>, DomainError> = await repo.save(gruppe);

            expect(result).toBeDefined();
            expect(result).toEqual({ ok: false, error: new EntityCouldNotBeCreated('Gruppe') });
        });
    });
});
