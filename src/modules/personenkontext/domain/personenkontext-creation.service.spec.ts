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
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { faker } from '@faker-js/faker';
import { Organisation } from '../../organisation/domain/organisation.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { PersonenkontextWorkflowFactory } from './personenkontext-workflow.factory.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { RolleNurAnPassendeOrganisationError } from '../specification/error/rolle-nur-an-passende-organisation.js';
import { PersonenkontextCreationService, PersonPersonenkontext } from './personenkontext-creation.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { Person } from '../../person/domain/person.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { PersonenkontextWorkflowSharedKernel } from './personenkontext-workflow-shared-kernel.js';

describe('PersonenkontextCreationService', () => {
    let module: TestingModule;
    let sut: PersonenkontextCreationService;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepositoryMock: DeepMocked<OrganisationRepository>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let personpermissionsMock: DeepMocked<PersonPermissions>;
    let personFactoryMock: DeepMocked<PersonFactory>;
    let dbiamPersonenkontextFactoryMock: DeepMocked<DbiamPersonenkontextFactory>;
    let personenkontextWorkflowSharedKernel: DeepMocked<PersonenkontextWorkflowSharedKernel>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                PersonenkontextCreationService,
                PersonenkontextWorkflowFactory,
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
                    provide: DbiamPersonenkontextFactory,
                    useValue: createMock<DbiamPersonenkontextFactory>(),
                },
                {
                    provide: PersonenkontextWorkflowSharedKernel,
                    useValue: createMock<PersonenkontextWorkflowSharedKernel>(),
                },
            ],
        }).compile();
        sut = module.get(PersonenkontextCreationService);
        rolleRepoMock = module.get(RolleRepo);
        organisationRepositoryMock = module.get(OrganisationRepository);
        personRepositoryMock = module.get(PersonRepository);
        personpermissionsMock = module.get(PersonPermissions);
        personFactoryMock = module.get(PersonFactory);
        dbiamPersonenkontextFactoryMock = module.get(DbiamPersonenkontextFactory);
        personenkontextWorkflowSharedKernel = module.get(PersonenkontextWorkflowSharedKernel);
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

    describe('createPersonWithPersonenkontexte', () => {
        it('should return DomainError if Person Aggregate ist invalid ', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(new InvalidAttributeLengthError('name.vorname'));
            rolleRepoMock.findById.mockResolvedValueOnce(DoFactory.createRolle(true));
            organisationRepositoryMock.findById.mockResolvedValueOnce(createMock<Organisation<true>>());

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontexte(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                [
                    {
                        organisationId: faker.string.uuid(),
                        rolleId: faker.string.uuid(),
                    },
                ],
            );
            expect(result).toBeInstanceOf(DomainError);
        });

        it('should return EntityNotFoundError if Organisation is not found', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            personenkontextWorkflowSharedKernel.checkReferences.mockResolvedValueOnce(new EntityNotFoundError());

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontexte(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                [
                    {
                        organisationId: faker.string.uuid(),
                        rolleId: faker.string.uuid(),
                    },
                ],
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return EntityNotFoundError if Rolle is not found', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            personenkontextWorkflowSharedKernel.checkReferences.mockResolvedValueOnce(new EntityNotFoundError());

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontexte(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                [
                    {
                        organisationId: faker.string.uuid(),
                        rolleId: faker.string.uuid(),
                    },
                ],
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return EntityNotFoundError if Rolle can NOT be assigned to organisation', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            personenkontextWorkflowSharedKernel.checkReferences.mockResolvedValueOnce(new EntityNotFoundError());

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontexte(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                [
                    {
                        organisationId: faker.string.uuid(),
                        rolleId: faker.string.uuid(),
                    },
                ],
            );
            expect(result).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return RolleNurAnPassendeOrganisationError if Rolle does NOT match organisation', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            personenkontextWorkflowSharedKernel.checkReferences.mockResolvedValueOnce(
                new RolleNurAnPassendeOrganisationError(),
            );

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontexte(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                [
                    {
                        organisationId: faker.string.uuid(),
                        rolleId: faker.string.uuid(),
                    },
                ],
            );
            expect(result).toBeInstanceOf(RolleNurAnPassendeOrganisationError);
        });

        it('should return MissingPermissionsError if user does NOT have permissions', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>({ rollenart: RollenArt.SYSADMIN });
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            rolleRepoMock.findByIds.mockResolvedValueOnce(
                new Map<string, Rolle<true>>([[faker.string.uuid(), rolleMock]]),
            );
            organisationRepositoryMock.findById.mockResolvedValueOnce(
                createMock<Organisation<true>>({ typ: OrganisationsTyp.LAND }),
            );
            personpermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
            personpermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontexte(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                [
                    {
                        organisationId: faker.string.uuid(),
                        rolleId: faker.string.uuid(),
                    },
                ],
            );
            expect(result).toBeInstanceOf(MissingPermissionsError);
        });

        it('should return DomainError if Person cannot be saved in the DB', async () => {
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

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontexte(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                [
                    {
                        organisationId: faker.string.uuid(),
                        rolleId: faker.string.uuid(),
                    },
                ],
            );
            expect(result).toBeInstanceOf(DomainError);
        });

        it('should return errors from update', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>({ rollenart: RollenArt.SYSADMIN });
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            organisationRepositoryMock.findById.mockResolvedValueOnce(
                createMock<Organisation<true>>({ typ: OrganisationsTyp.LAND }),
            );
            personpermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            personRepositoryMock.create.mockResolvedValueOnce(createMock<Person<true>>({ id: faker.string.uuid() }));

            const personenkontextUpdateMock: DeepMocked<PersonenkontexteUpdate> = createMock();
            personenkontextUpdateMock.update.mockResolvedValueOnce(new PersonenkontexteUpdateError('Error'));
            dbiamPersonenkontextFactoryMock.createNewPersonenkontexteUpdate.mockReturnValueOnce(
                personenkontextUpdateMock,
            );

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontexte(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                [
                    {
                        organisationId: faker.string.uuid(),
                        rolleId: faker.string.uuid(),
                    },
                ],
            );
            expect(result).toBeInstanceOf(DomainError);
        });

        it('should return errors if more or less than 1 personenkontext was updated', async () => {
            personFactoryMock.createNew.mockResolvedValueOnce(createMock<Person<false>>());
            const rolleMock: DeepMocked<Rolle<true>> = createMock<Rolle<true>>({ rollenart: RollenArt.SYSADMIN });
            rolleMock.canBeAssignedToOrga.mockResolvedValueOnce(true);
            rolleRepoMock.findById.mockResolvedValueOnce(rolleMock);
            organisationRepositoryMock.findById.mockResolvedValueOnce(
                createMock<Organisation<true>>({ typ: OrganisationsTyp.LAND }),
            );
            personpermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            personRepositoryMock.create.mockResolvedValueOnce(createMock<Person<true>>({ id: faker.string.uuid() }));

            const personenkontextUpdateMock: DeepMocked<PersonenkontexteUpdate> = createMock();
            personenkontextUpdateMock.update.mockResolvedValueOnce([]);
            dbiamPersonenkontextFactoryMock.createNewPersonenkontexteUpdate.mockReturnValueOnce(
                personenkontextUpdateMock,
            );

            const result: PersonPersonenkontext | DomainError = await sut.createPersonWithPersonenkontexte(
                personpermissionsMock,
                faker.string.uuid(),
                faker.string.uuid(),
                [
                    {
                        organisationId: faker.string.uuid(),
                        rolleId: faker.string.uuid(),
                    },
                ],
            );
            expect(result).toBeInstanceOf(DomainError);
        });
    });
});
