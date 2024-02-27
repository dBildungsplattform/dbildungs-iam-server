import { faker } from '@faker-js/faker';
import { DomainError } from '../../../shared/error/domain.error.js';
import { CreateGroupBodyParams } from '../api/create-group.body.params.js';
import { GruppenDo } from './gruppe.do.js';
import { GruppenTyp, Gruppenbereich, Gruppendifferenzierung } from './gruppe.enums.js';
import { Gruppe } from './gruppe.js';
import { EntityManager } from '@mikro-orm/postgresql';
import { TestingModule, Test } from '@nestjs/testing';
import { GruppeMapper } from './gruppe.mapper.js';
import { GruppenRepository } from './gruppe.repo.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { ConfigTestModule } from '../../../../test/utils/index.js';

describe('GruppeRepo', () => {
    describe('when creating gruppe with invalid data', () => {
        let module: TestingModule;
        let repo: GruppenRepository;
        let em: DeepMocked<EntityManager>;
        let mapper: DeepMocked<GruppeMapper>;

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
            mapper.mapGruppeToGruppeEntity.mockReturnValue(new GruppeEntity());
            em.persistAndFlush.mockRejectedValue(new Error('Error'));

            const result: GruppenDo<true> | DomainError = await repo.createGruppe(gruppe);

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(EntityCouldNotBeCreated);
        });
    });
});
