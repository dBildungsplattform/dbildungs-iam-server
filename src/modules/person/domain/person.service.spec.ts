import { Dictionary, Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import {
    DomainError,
    EntityNotFoundError,
    InvalidAttributeLengthError,
    KeycloakClientError,
    MissingPermissionsError,
} from '../../../shared/error/index.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonDo } from './person.do.js';
import { PersonPersonenkontext, PersonService } from './person.service.js';
import { Paged } from '../../../shared/paging/index.js';
import { PersonFactory } from './person.factory.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { faker } from '@faker-js/faker';
import { Organisation } from '../../organisation/domain/organisation.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { Person } from './person.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';

describe('sut', () => {
    let module: TestingModule;
    let sut: PersonService;
    let personRepoMock: DeepMocked<PersonRepo>;
    let mapperMock: DeepMocked<Mapper>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepositoryMock: DeepMocked<OrganisationRepository>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let personpermissionsMock: DeepMocked<PersonPermissions>;
    let personFactoryMock: DeepMocked<PersonFactory>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonService,
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
            ],
        }).compile();
        sut = module.get(PersonService);
        personRepoMock = module.get(PersonRepo);
        mapperMock = module.get(getMapperToken());
        rolleRepoMock = module.get(RolleRepo);
        organisationRepositoryMock = module.get(OrganisationRepository);
        personRepositoryMock = module.get(PersonRepository);
        personpermissionsMock = module.get(PersonPermissions);
        personFactoryMock = module.get(PersonFactory);
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

    describe('createPersonWithPersonenkontext', () => {
        it('should return DomainError if Person Aggregate ist invalid ', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(new InvalidAttributeLengthError('name.vorname'));
            rolleRepoMock.findById.mockResolvedValueOnce(DoFactory.createRolle(true));
            organisationRepositoryMock.findById.mockResolvedValueOnce(createMock<Organisation<true>>());

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontext(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(result).toBeInstanceOf(DomainError);
        });

        it('should return EntityNotFoundError if Organisation is not found', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            rolleRepoMock.findById.mockResolvedValueOnce(DoFactory.createRolle(true));
            organisationRepositoryMock.findById.mockResolvedValueOnce(undefined);

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontext(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return EntityNotFoundError if Rolle is not found', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);
            organisationRepositoryMock.findById.mockResolvedValueOnce(createMock<Organisation<true>>());

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontext(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return EntityNotFoundError if Rolle can NOT be assigned to organisation', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(false);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            organisationRepositoryMock.findById.mockResolvedValueOnce(createMock<Organisation<true>>());

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontext(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return RolleNurAnPassendeOrganisationError if Rolle does NOT match organisation', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>({ rollenart: RollenArt.SYSADMIN });
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            organisationRepositoryMock.findById.mockResolvedValueOnce(
                createMock<Organisation<true>>({ typ: OrganisationsTyp.SCHULE }),
            );

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontext(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(result).toBeInstanceOf(RolleNurAnPassendeOrganisationError);
        });

        it('should return MissingPermissionsError if user does NOT have permissions', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>({ rollenart: RollenArt.SYSADMIN });
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            organisationRepositoryMock.findById.mockResolvedValueOnce(
                createMock<Organisation<true>>({ typ: OrganisationsTyp.LAND }),
            );
            personpermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontext(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(result).toBeInstanceOf(MissingPermissionsError);
        });

        it('should return DomainError if Person can be saved in the DB', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>({ rollenart: RollenArt.SYSADMIN });
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            organisationRepositoryMock.findById.mockResolvedValueOnce(
                createMock<Organisation<true>>({ typ: OrganisationsTyp.LAND }),
            );
            personpermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            personRepositoryMock.create.mockResolvedValueOnce(
                new KeycloakClientError('Username or email already exists'),
            );

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontext(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(result).toBeInstanceOf(DomainError);
        });
    });
});
