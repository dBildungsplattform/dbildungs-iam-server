import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PersonenkontextRepo } from '../../personenkontext/persistence/personenkontext.repo.js';
import { PersonApiMapper } from '../mapper/person-api.mapper.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonInfoController } from './person-info.controller.js';
import { PersonInfoResponse } from './person-info.response.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';

describe('PersonInfoController', () => {
    let module: TestingModule;
    let sut: PersonInfoController;
    let personRepoMock: DeepMocked<PersonRepo>;
    let personenkontextRepoMock: DeepMocked<PersonenkontextRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonInfoController,
                PersonApiMapper,
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: PersonRepo,
                    useValue: createMock<PersonRepo>(),
                },
                {
                    provide: PersonenkontextRepo,
                    useValue: createMock<PersonenkontextRepo>(),
                },
            ],
        }).compile();

        sut = module.get<PersonInfoController>(PersonInfoController);
        personRepoMock = module.get(PersonRepo);
        personenkontextRepoMock = module.get(PersonenkontextRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('info', () => {
        describe('when person exists', () => {
            it('should return person info', async () => {
                // Arrange
                const person: PersonDo<true> = DoFactory.createPerson(true);
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;

                personRepoMock.findById.mockResolvedValue(person);
                personenkontextRepoMock.findBy.mockResolvedValue([[], 0]);

                // Act
                const result: PersonInfoResponse = await sut.info(permissions);

                // Assert
                expect(result).toEqual<PersonInfoResponse>({
                    pid: person.id,
                    person: {
                        id: person.id,
                        mandant: person.mandant,
                        referrer: person.referrer,
                        name: {
                            familiennamen: person.familienname,
                            vorname: person.vorname,
                            anrede: person.nameAnrede,
                            initialenfamilienname: person.initialenFamilienname,
                            initialenvorname: person.initialenVorname,
                            rufname: person.rufname,
                            titel: person.nameTitel,
                            namenspraefix: person.namePraefix,
                            namenssuffix: person.nameSuffix,
                            sortierindex: person.nameSortierindex,
                        },
                        geburt: {
                            datum: person.geburtsdatum,
                            geburtsort: person.geburtsort,
                        },
                        stammorganisation: person.stammorganisation,
                        geschlecht: person.geschlecht,
                        lokalisierung: person.lokalisierung,
                        vertrauensstufe: person.vertrauensstufe,
                        revision: person.revision,
                    },
                    personenkontexte: [],
                    gruppen: [],
                });
            });
        });

        describe('when person does not exist', () => {
            it('should return null', async () => {
                // Arrange
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;

                personRepoMock.findById.mockResolvedValue(null);

                // Act and Assert
                await expect(() => sut.info(permissions)).rejects.toThrow(HttpException);
            });
        });
    });
});
