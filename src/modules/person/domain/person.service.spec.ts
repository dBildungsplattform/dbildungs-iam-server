import { Dictionary, Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonDo } from './person.do.js';
import { PersonService } from './person.service.js';
import { Paged } from '../../../shared/paging/index.js';
import { PersonFactory } from './person.factory.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { PersonenkontextWorkflowFactory } from '../../personenkontext/domain/personenkontext-workflow.factory.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { DbiamPersonenkontextFactory } from '../../personenkontext/domain/dbiam-personenkontext.factory.js';

describe('PersonService', () => {
    let module: TestingModule;
    let sut: PersonService;
    let personRepoMock: DeepMocked<PersonRepo>;
    let mapperMock: DeepMocked<Mapper>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonService,
                PersonenkontextWorkflowFactory,
                {
                    provide: PersonRepo,
                    useValue: createMock<PersonRepo>(),
                },
                {
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: PersonFactory,
                    useValue: createMock<PersonFactory>(),
                },
                {
                    provide: PersonenkontextFactory,
                    useValue: createMock<PersonenkontextFactory>(),
                },
                {
                    provide: PersonPermissions,
                    useValue: createMock<PersonPermissions>(),
                },
                {
                    provide: OrganisationRepo,
                    useValue: createMock<OrganisationRepo>(),
                },
                {
                    provide: DbiamPersonenkontextFactory,
                    useValue: createMock<DbiamPersonenkontextFactory>(),
                },
            ],
        }).compile();
        sut = module.get(PersonService);
        personRepoMock = module.get(PersonRepo);
        mapperMock = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findPersonById', () => {
        describe('when person exists', () => {
            it('should get a person', async () => {
                const person: PersonDo<true> = DoFactory.createPerson(true);
                personRepoMock.findById.mockResolvedValue(person);
                mapperMock.map.mockReturnValue(person as unknown as Dictionary<unknown>);
                const result: Result<PersonDo<true>> | Error = await sut.findPersonById(person.id);
                expect(result).toEqual<Result<PersonDo<true>>>({
                    ok: true,
                    value: person,
                });
            });
        });

        describe('when person cloud not be found', () => {
            it('should get a EntityNotFoundError error ', async () => {
                const person: PersonDo<true> = DoFactory.createPerson(true);
                personRepoMock.findById.mockResolvedValue(null);
                mapperMock.map.mockReturnValue(person as unknown as Dictionary<unknown>);
                const result: Result<PersonDo<true>> | Error = await sut.findPersonById(person.id);
                expect(result).toEqual<Result<PersonDo<true>>>({
                    ok: false,
                    error: new EntityNotFoundError('Person', person.id),
                });
            });
        });
    });

    describe('findAllPersons', () => {
        it('should get all persons that match', async () => {
            const firstPerson: PersonDo<true> = DoFactory.createPerson(true);
            const secondPerson: PersonDo<true> = DoFactory.createPerson(true);
            const persons: Counted<PersonDo<true>> = [[firstPerson, secondPerson], 2];

            personRepoMock.findBy.mockResolvedValue(persons);
            mapperMock.map.mockReturnValue(persons as unknown as Dictionary<unknown>);

            const personDoWithQueryParam: PersonDo<false> = DoFactory.createPerson(false);
            const result: Paged<PersonDo<true>> = await sut.findAllPersons(personDoWithQueryParam, 0, 10);

            expect(result.items).toHaveLength(2);
        });

        it('should return an empty list of persons ', async () => {
            const person: PersonDo<false> = DoFactory.createPerson(false);

            personRepoMock.findBy.mockResolvedValue([[], 0]);
            mapperMock.map.mockReturnValue(person as unknown as Dictionary<unknown>);

            const result: Paged<PersonDo<true>> = await sut.findAllPersons(person);

            expect(result.items).toBeInstanceOf(Array);
            expect(result.items).toHaveLength(0);
        });
    });
});
