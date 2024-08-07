import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { PersonID } from '../../../shared/types/index.js';
import { DbiamPersonenkontextBodyParams } from '../api/param/dbiam-personenkontext.body.params.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { UpdatePersonIdMismatchError } from './error/update-person-id-mismatch.error.js';
import { Personenkontext } from './personenkontext.js';
import { UpdateCountError } from './error/update-count.error.js';
import { UpdateOutdatedError } from './error/update-outdated.error.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { EventService } from '../../../core/eventbus/index.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { UpdatePersonNotFoundError } from './error/update-person-not-found.error.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { PersonPermissionsMock } from '../../../../test/utils/index.js';
import { Person } from '../../person/domain/person.js';

function createPKBodyParams(personId: PersonID): DbiamPersonenkontextBodyParams[] {
    const firstCreatePKBodyParams: DbiamPersonenkontextBodyParams = createMock<DbiamPersonenkontextBodyParams>({
        personId: personId,
        organisationId: faker.string.uuid(),
        rolleId: faker.string.uuid(),
    });

    const secondCreatePKBodyParams: DbiamPersonenkontextBodyParams = createMock<DbiamPersonenkontextBodyParams>({
        personId: personId,
        organisationId: faker.string.uuid(),
        rolleId: faker.string.uuid(),
    });

    return [firstCreatePKBodyParams, secondCreatePKBodyParams];
}

describe('PersonenkontexteUpdate', () => {
    let module: TestingModule;
    let personRepoMock: DeepMocked<PersonRepository>;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let dbiamPersonenkontextFactory: DbiamPersonenkontextFactory;
    let sut: PersonenkontexteUpdate;
    let personId: string;
    let lastModified: Date;
    let bodyParam1: DbiamPersonenkontextBodyParams;
    let bodyParam2: DbiamPersonenkontextBodyParams;
    let pk1: Personenkontext<true>;
    let pk2: Personenkontext<true>;
    let personPermissionsMock: PersonPermissionsMock;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: PersonRepo,
                    useValue: createMock<PersonRepo>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                EventService,
                DbiamPersonenkontextFactory,
                PersonenkontextFactory,
            ],
        }).compile();
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        personRepoMock = module.get(PersonRepository);
        dbiamPersonenkontextFactory = module.get(DbiamPersonenkontextFactory);
        personId = faker.string.uuid();
        lastModified = faker.date.recent();
        bodyParam1 = createMock<DbiamPersonenkontextBodyParams>({
            personId: personId,
            organisationId: faker.string.uuid(),
            rolleId: faker.string.uuid(),
        });
        bodyParam2 = createMock<DbiamPersonenkontextBodyParams>({
            personId: personId,
            organisationId: faker.string.uuid(),
            rolleId: faker.string.uuid(),
        });
        pk1 = createMock<Personenkontext<true>>({
            updatedAt: lastModified,
            personId: bodyParam1.personId,
            organisationId: bodyParam1.organisationId,
            rolleId: bodyParam1.rolleId,
        });
        pk2 = createMock<Personenkontext<true>>({
            updatedAt: faker.date.past(),
            personId: bodyParam2.personId,
            organisationId: bodyParam2.organisationId,
            rolleId: bodyParam2.rolleId,
        });
        personPermissionsMock = new PersonPermissionsMock();
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(dbiamPersonenkontextFactory).toBeDefined();
    });

    describe('update', () => {
        describe('when sent personenkontexte contain new personenkontext', () => {
            beforeAll(() => {
                const count: number = 1;

                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    lastModified,
                    count,
                    createPKBodyParams(personId),
                    personPermissionsMock,
                );
            });

            it('should return PersonenkontextSpecificationError', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(null);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(null); //mock pk2 is not found => therefore handled as new
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1]); //mock pk1 is found as existing in DB

                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock the return values in the end of update method

                const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();

                expect(updateResult).toBeInstanceOf(Array);
            });
        });

        describe('when sent personenkontexte contain personenkontext with mismatching personId', () => {
            beforeAll(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    faker.string.uuid(),
                    lastModified,
                    count,
                    createPKBodyParams(personId),
                    personPermissionsMock,
                );
            });

            it('should return UpdatePersonIdMismatchError', async () => {
                const updateError: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();

                expect(updateError).toBeInstanceOf(UpdatePersonIdMismatchError);
            });
        });

        describe('when existing personenkontexte amount does NOT match count', () => {
            beforeAll(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    lastModified,
                    count,
                    [bodyParam1, bodyParam2],
                    personPermissionsMock,
                );
            });

            it('should return UpdateCountError', async () => {
                const newPerson: Person<true> = createMock<Person<true>>();
                personRepoMock.findById.mockResolvedValueOnce(newPerson);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1]); //mock: only one PK is found

                const updateError: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();

                expect(updateError).toBeInstanceOf(UpdateCountError);
            });
        });

        describe('when most recent updated PK time does not match lastModified time', () => {
            beforeAll(() => {
                const wrongLastModified: Date = faker.date.past();
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    wrongLastModified,
                    count,
                    [bodyParam1, bodyParam2],
                    personPermissionsMock,
                );
            });

            it('should return UpdateOutdatedError', async () => {
                const newPerson: Person<true> = createMock<Person<true>>();
                personRepoMock.findById.mockResolvedValueOnce(newPerson);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: both PKs are found
                const updateError: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();

                expect(updateError).toBeInstanceOf(UpdateOutdatedError);
            });
        });

        describe('when person is not found', () => {
            beforeAll(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    lastModified,
                    count,
                    [bodyParam1, bodyParam2],
                    personPermissionsMock,
                );
            });

            it('should return UpdatePersonNotFound', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: only one PK is found

                personRepoMock.findById.mockResolvedValue(undefined);
                const updateError: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();

                expect(updateError).toBeInstanceOf(UpdatePersonNotFoundError);
            });
        });

        describe('when person is not found', () => {
            beforeAll(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    lastModified,
                    count,
                    [bodyParam1, bodyParam2],
                    personPermissionsMock,
                );
            });

            it('should return UpdatePersonNotFound', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: only one PK is found

                personRepoMock.findById.mockResolvedValue(undefined);
                const updateError: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();

                expect(updateError).toBeInstanceOf(UpdatePersonNotFoundError);
            });
        });

        describe('when validate returns no errors', () => {
            beforeEach(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    lastModified,
                    count,
                    [bodyParam1, bodyParam2],
                    personPermissionsMock,
                );
            });

            it('should return null asc order', async () => {
                const newPerson: Person<true> = createMock<Person<true>>();
                personRepoMock.findById.mockResolvedValueOnce(newPerson);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: both PKs are found
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: return the PKs found after update
                const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();

                expect(updateResult).toBeInstanceOf(Array);
                expect(dBiamPersonenkontextRepoMock.delete).toHaveBeenCalledTimes(0);
            });

            // This test only test for right sorting by date of PKs, pk2 and pk1 are switched in retrieval order
            it('should return null', async () => {
                const newPerson: Person<true> = createMock<Person<true>>();
                personRepoMock.findById.mockResolvedValueOnce(newPerson);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk2, pk1]); //mock: both PKs are found
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: return the PKs found after update

                expect(dBiamPersonenkontextRepoMock.delete).toHaveBeenCalledTimes(0);
                const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();
                expect(updateResult).toBeInstanceOf(Array);
            });
        });
        describe('when there are no existing PKs and lastModified is undefined', () => {
            beforeEach(() => {
                const count: number = 0;
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    undefined,
                    count,
                    [],
                    personPermissionsMock,
                );
            });

            it('should return empty', async () => {
                const newPerson: Person<true> = createMock<Person<true>>();
                personRepoMock.findById.mockResolvedValueOnce(newPerson);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValue([]); // No existing PKs

                const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();
                expect(updateResult).toEqual([]);
            });
        });
        describe('when there are existing PKs but lastModified is undefined', () => {
            beforeEach(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    undefined,
                    count,
                    [bodyParam1, bodyParam2],
                    personPermissionsMock,
                );
            });

            it('should return UpdateOutdatedError', async () => {
                const newPerson: Person<true> = createMock<Person<true>>();
                personRepoMock.findById.mockResolvedValueOnce(newPerson);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); // Existing PKs

                const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();
                expect(updateResult).toBeInstanceOf(UpdateOutdatedError);
            });
        });

        describe('when permissions are insufficient', () => {
            it('should return MissingPermissionsError if the target person can not be modified', async () => {
                const newPerson: Person<true> = createMock<Person<true>>();
                personRepoMock.findById.mockResolvedValueOnce(newPerson);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk2, pk1]); //mock: both PKs are found
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: return the PKs found after update
                const permissions: DeepMocked<PersonPermissions> = createMock();
                permissions.canModifyPerson.mockResolvedValueOnce(false);
                const pkUpdate: PersonenkontexteUpdate = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    lastModified,
                    2,
                    [bodyParam1, bodyParam2],
                    permissions,
                );

                await expect(pkUpdate.update()).resolves.toBeInstanceOf(MissingPermissionsError);
            });

            it('should return MissingPermissionsError if the user can not modify persons at organisation', async () => {
                const newPerson: Person<true> = createMock<Person<true>>();
                personRepoMock.findById.mockResolvedValueOnce(newPerson);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk2, pk1]); //mock: both PKs are found
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: return the PKs found after update
                const permissions: DeepMocked<PersonPermissions> = createMock();
                permissions.canModifyPerson.mockResolvedValueOnce(true);
                permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
                const pkUpdate: PersonenkontexteUpdate = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
                    personId,
                    lastModified,
                    2,
                    [bodyParam1, bodyParam2],
                    permissions,
                );

                await expect(pkUpdate.update()).resolves.toBeInstanceOf(MissingPermissionsError);
            });
        });
    });
});
