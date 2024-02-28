import { faker } from '@faker-js/faker';
import { DomainError } from '../../../shared/error/domain.error.js';
import { CreateGroupBodyParams } from '../api/create-group.body.params.js';
import { GruppenTyp, Gruppenbereich, Gruppendifferenzierung } from './gruppe.enums.js';
import { Gruppe } from './gruppe.js';
import { EntityManager } from '@mikro-orm/postgresql';
import { TestingModule, Test } from '@nestjs/testing';
import { GruppenRepository } from './gruppe.repo.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { ConfigTestModule } from '../../../../test/utils/index.js';

describe('GruppeRepo', () => {
    let module: TestingModule;
    let repo: GruppenRepository;
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
            ],
        }).compile();
        repo = module.get(GruppenRepository);
        em = module.get(EntityManager);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });
    describe('when creating gruppe with invalid data', () => {
        it('should return Domain error', async () => {
            const createGroupBodyParams: CreateGroupBodyParams = {
                bezeichnung: faker.lorem.word(),
                typ: GruppenTyp.KLASSE,
                bereich: Gruppenbereich.PFLICHT,
                differenzierung: Gruppendifferenzierung.E,
                bildungsziele: [],
                jahrgangsstufen: [],
                faecher: [],
                referenzgruppen: [],
                laufzeit: {},
            };
            const gruppe: Gruppe = Gruppe.createGroup(createGroupBodyParams);
            const gruppeEntity: GruppeEntity = new GruppeEntity();
            gruppeEntity.bezeichnung = gruppe.getBezeichnung();
            gruppeEntity.typ = gruppe.getTyp();
            gruppeEntity.bereich = gruppe.getBereich();
            gruppeEntity.differenzierung = gruppe.getDifferenzierung();
            gruppeEntity.bildungsziele = gruppe.getBildungsziele();
            gruppeEntity.jahrgangsstufen = gruppe.getJahrgangsstufen();
            gruppeEntity.faecher = gruppe.getFaecher();
            gruppeEntity.referenzgruppen = gruppe.getReferenzgruppen();
            gruppeEntity.laufzeit = gruppe.getLaufzeit();

            em.persistAndFlush.mockRejectedValue(new Error('Error'));

            const result: Result<GruppeEntity, DomainError> = await repo.createGruppe(gruppeEntity);

            expect(result).toBeDefined();
            expect(result).toEqual({ ok: false, error: new EntityCouldNotBeCreated('Gruppe') });
        });
    });
});
