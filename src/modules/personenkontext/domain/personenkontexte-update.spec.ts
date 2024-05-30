import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { PersonID } from '../../../shared/types/index.js';
import { DBiamCreatePersonenkontextBodyParams } from '../api/param/dbiam-create-personenkontext.body.params.js';
import { PersonenkontextSpecificationError } from '../specification/error/personenkontext-specification.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { UpdatePersonIdMismatchError } from '../specification/error/update-person-id-mismatch.error.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { Personenkontext } from './personenkontext.js';
import { UpdateCountError } from '../specification/error/update-count.error.js';
import { UpdateOutdatedError } from '../specification/error/update-outdated.error.js';

function createPKBodyParams(personId: PersonID): DBiamCreatePersonenkontextBodyParams[] {
    const firstCreatePKBodyParams: DBiamCreatePersonenkontextBodyParams =
        createMock<DBiamCreatePersonenkontextBodyParams>({
            personId: personId,
            organisationId: faker.string.uuid(),
            rolleId: faker.string.uuid(),
        });

    const secondCreatePKBodyParams: DBiamCreatePersonenkontextBodyParams =
        createMock<DBiamCreatePersonenkontextBodyParams>({
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
    let bodyParam1: DBiamCreatePersonenkontextBodyParams;
    let bodyParam2: DBiamCreatePersonenkontextBodyParams;
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
                DbiamPersonenkontextFactory,
            ],
        }).compile();
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        dbiamPersonenkontextFactory = module.get(DbiamPersonenkontextFactory);

        personId = faker.string.uuid();
        lastModified = faker.date.recent();
        bodyParam1 = createMock<DBiamCreatePersonenkontextBodyParams>({
            personId: personId,
            organisationId: faker.string.uuid(),
            rolleId: faker.string.uuid(),
        });
        bodyParam2 = createMock<DBiamCreatePersonenkontextBodyParams>({
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
        describe('when sent personenkontexte contain non-existing personkontext', () => {
            beforeAll(() => {
                const count: number = 2;

                sut = dbiamPersonenkontextFactory.createNew(
                    personId,
                    lastModified,
                    count,
                    createPKBodyParams(personId),
                );
            });

            it('should return PersonenkontextSpecificationError', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(null);
                const updateError: Option<PersonenkontextSpecificationError> = await sut.update();

                expect(updateError).toBeTruthy();
            });
        });

        describe('when sent personenkontexte contain personenkontext with mismatching personId', () => {
            beforeAll(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNew(
                    faker.string.uuid(),
                    lastModified,
                    count,
                    createPKBodyParams(personId),
                );
            });

            it('should return UpdatePersonIdMismatchError', async () => {
                const updateError: Option<PersonenkontextSpecificationError> = await sut.update();

                expect(updateError).toBeTruthy();
                expect(updateError).toBeInstanceOf(UpdatePersonIdMismatchError);
            });
        });

        describe('when existing personenkontexte cannot be found', () => {
            beforeAll(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNew(personId, lastModified, count, [bodyParam1, bodyParam2]);
            });

            it('should return EntityNotFoundError', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([]); //mock: no existing pks are found
                const updateError: Option<PersonenkontextSpecificationError> = await sut.update();

                expect(updateError).toBeTruthy();
                expect(updateError).toBeInstanceOf(EntityNotFoundError);
            });
        });

        describe('when existing personenkontexte amount does NOT match count', () => {
            beforeAll(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNew(personId, lastModified, count, [bodyParam1, bodyParam2]);
            });

            it('should return UpdateCountError', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1]); //mock: only one PK is found
                const updateError: Option<PersonenkontextSpecificationError> = await sut.update();

                expect(updateError).toBeTruthy();
                expect(updateError).toBeInstanceOf(UpdateCountError);
            });
        });

        describe('when most recent updated PK time does not match lastModified time', () => {
            beforeAll(() => {
                const wrongLastModified: Date = faker.date.past();
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNew(personId, wrongLastModified, count, [
                    bodyParam1,
                    bodyParam2,
                ]);
            });

            it('should return UpdateOutdatedError', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: both PKs are found
                const updateError: Option<PersonenkontextSpecificationError> = await sut.update();

                expect(updateError).toBeTruthy();
                expect(updateError).toBeInstanceOf(UpdateOutdatedError);
            });
        });

        describe('when validate returns no errors', () => {
            beforeAll(() => {
                const count: number = 2;
                sut = dbiamPersonenkontextFactory.createNew(personId, lastModified, count, [bodyParam1, bodyParam2]);
            });

            it('should return null', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk2);
                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk1, pk2]); //mock: both PKs are found
                const updateError: Option<PersonenkontextSpecificationError> = await sut.update();

                expect(updateError).toBeNull();
            });

            // This test only test for right sorting by date of PKs, pk2 and pk1 are switched in retrieval order
            it('should return null', async () => {
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk1);
                dBiamPersonenkontextRepoMock.find.mockResolvedValue(pk2);

                dBiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([pk2, pk1]); //mock: both PKs are found

                const updateError: Option<PersonenkontextSpecificationError> = await sut.update();
                expect(updateError).toBeNull();
            });
        });
    });
});
