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
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let dbiamPersonenkontextFactory: DbiamPersonenkontextFactory;
    let sut: PersonenkontexteUpdate;
    let personId: string;
    let lastModified: Date;
    let bodyParam1: DbiamPersonenkontextBodyParams;
    let bodyParam2: DbiamPersonenkontextBodyParams;
    let pk1: Personenkontext<true>;
    let pk2: Personenkontext<true>;

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
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(personId, lastModified, count, [
                    bodyParam1,
                    bodyParam2,
                ]);
            });

            it('should return UpdateCountError', async () => {
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
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(personId, wrongLastModified, count, [
                    bodyParam1,
                    bodyParam2,
                ]);
            });

            it('should return UpdateOutdatedError', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValueOnce(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: both PKs are found
                const updateError: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();

                expect(updateError).toBeInstanceOf(UpdateOutdatedError);
            });
        });

        describe('when validate returns no errors', () => {
            beforeEach(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(personId, lastModified, count, [
                    bodyParam1,
                    bodyParam2,
                ]);
            });

            it('should return null asc order', async () => {
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
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk2, pk1]); //mock: both PKs are found
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: return the PKs found after update

                expect(dBiamPersonenkontextRepoMock.delete).toHaveBeenCalledTimes(0);
                const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await sut.update();
                expect(updateResult).toBeInstanceOf(Array);
            });
        });
    });
});
