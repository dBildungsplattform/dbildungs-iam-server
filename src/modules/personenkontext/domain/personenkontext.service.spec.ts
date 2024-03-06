import { Dictionary, Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { PersonenkontextRepo } from '../persistence/personenkontext.repo.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { PersonenkontextDo } from './personenkontext.do.js';
import { PersonenkontextService } from './personenkontext.service.js';
import { MismatchedRevisionError } from '../../../shared/error/mismatched-revision.error.js';
import { EntityCouldNotBeUpdated } from '../../../shared/error/entity-could-not-be-updated.error.js';
import { EntityCouldNotBeDeleted } from '../../../shared/error/index.js';
import { DBiamPersonenkontextRepo } from '../dbiam/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { faker } from '@faker-js/faker';

describe('PersonenkontextService', () => {
    let module: TestingModule;
    let personenkontextService: PersonenkontextService;
    let personenkontextRepoMock: DeepMocked<PersonenkontextRepo>;
    let personRepoMock: DeepMocked<PersonRepo>;
    let dbiamPersonenKontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let mapperMock: DeepMocked<Mapper>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonenkontextService,
                {
                    provide: PersonenkontextRepo,
                    useValue: createMock<PersonenkontextRepo>(),
                },
                {
                    provide: PersonRepo,
                    useValue: createMock<PersonRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
            ],
        }).compile();
        personenkontextService = module.get(PersonenkontextService);
        personenkontextRepoMock = module.get(PersonenkontextRepo);
        personRepoMock = module.get(PersonRepo);
        dbiamPersonenKontextRepoMock = module.get(DBiamPersonenkontextRepo);
        mapperMock = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(personenkontextService).toBeDefined();
    });

    describe('createPersonenkontext', () => {
        describe('when person does not exist', () => {
            it('should return EntityNotFoundError', async () => {
                const personenkontextDo: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);

                personRepoMock.findById.mockResolvedValueOnce(null);

                const result: Result<
                    PersonenkontextDo<true>,
                    DomainError
                > = await personenkontextService.createPersonenkontext(personenkontextDo);
                expect(result).toEqual<Result<PersonenkontextDo<true>, DomainError>>({
                    ok: false,
                    error: new EntityNotFoundError('Person'),
                });
            });
        });

        describe('when personenkontext is saved successfully', () => {
            it('should return PersonenkontextDo in result', async () => {
                const personDo: PersonDo<true> = DoFactory.createPerson(true);
                const personenkontextDo: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);

                personRepoMock.findById.mockResolvedValueOnce(personDo);
                personenkontextRepoMock.save.mockResolvedValue(personenkontextDo as unknown as PersonenkontextDo<true>);
                mapperMock.map.mockReturnValue(personenkontextDo as unknown as Dictionary<unknown>);
                const result: Result<PersonenkontextDo<true>> =
                    await personenkontextService.createPersonenkontext(personenkontextDo);
                expect(result).toEqual<Result<PersonenkontextDo<true>>>({
                    ok: true,
                    value: personenkontextDo as unknown as PersonenkontextDo<true>,
                });
            });
        });

        describe('when personenkontext is not saved successfully', () => {
            it('should return a EntityCouldNotBeCreated error', async () => {
                const personDo: PersonDo<true> = DoFactory.createPerson(true);
                const personenkontextDo: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);

                personRepoMock.findById.mockResolvedValueOnce(personDo);

                const result: Result<
                    PersonenkontextDo<true>,
                    DomainError
                > = await personenkontextService.createPersonenkontext(personenkontextDo);
                expect(result).toEqual<Result<PersonenkontextDo<true>, DomainError>>({
                    ok: false,
                    error: new EntityCouldNotBeCreated(`Personenkontext`),
                });
            });
        });
    });

    describe('findAllPersonenkontexte', () => {
        describe('When personenkontexte are found', () => {
            it('should get all personenkontexte that match', async () => {
                const personenkontext1: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);
                const personenkontext2: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);
                const personenkontexte: PersonenkontextDo<true>[] = [
                    personenkontext1 as unknown as PersonenkontextDo<true>,
                    personenkontext2 as unknown as PersonenkontextDo<true>,
                ];
                personenkontextRepoMock.findBy.mockResolvedValue([personenkontexte, personenkontexte.length]);
                mapperMock.map.mockReturnValue(personenkontexte as unknown as Dictionary<unknown>);
                const personenkontextDoWithQueryParam: PersonenkontextDo<false> =
                    DoFactory.createPersonenkontext(false);

                const result: Paged<PersonenkontextDo<true>> = await personenkontextService.findAllPersonenkontexte(
                    personenkontextDoWithQueryParam,
                );

                expect(result).toEqual<Paged<PersonenkontextDo<true>>>({
                    items: personenkontexte,
                    total: personenkontexte.length,
                    offset: 0,
                    limit: personenkontexte.length,
                });
            });
        });

        describe('When no personenkontexte are found', () => {
            it('should return a result with an empty array', async () => {
                const personenkontext: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);
                personenkontextRepoMock.findBy.mockResolvedValue([[], 0]);
                mapperMock.map.mockReturnValue(personenkontext as unknown as Dictionary<unknown>);

                const result: Paged<PersonenkontextDo<true>> =
                    await personenkontextService.findAllPersonenkontexte(personenkontext);

                expect(result).toEqual<Paged<PersonenkontextDo<true>>>({
                    items: [],
                    total: 0,
                    offset: 0,
                    limit: 0,
                });
            });
        });
    });

    describe('findPersonenkontextById', () => {
        describe('when finding personenkontext with given id', () => {
            it('should return found personenkontext', async () => {
                const personenkontext: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);

                personenkontextRepoMock.findById.mockResolvedValue(personenkontext);

                const result: Result<
                    PersonenkontextDo<true>,
                    DomainError
                > = await personenkontextService.findPersonenkontextById(personenkontext.id);

                expect(result).toStrictEqual({ ok: true, value: personenkontext });
            });
        });

        describe('when NOT finding personenkontext with given id', () => {
            it('should return domain error', async () => {
                const personenkontext: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);

                personenkontextRepoMock.findById.mockResolvedValue(null);

                const result: Result<
                    PersonenkontextDo<true>,
                    DomainError
                > = await personenkontextService.findPersonenkontextById(personenkontext.id);

                expect(result).toStrictEqual({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext', personenkontext.id),
                });
            });
        });
    });

    describe('findPersonenkontexteByPersonId', () => {
        describe('when finding personenkontext via personId', () => {
            it('should return found personenkontext', async () => {
                const personenkontexte: Personenkontext<true>[] = [
                    {
                        id: '1',
                        personId: '1',
                        rolleId: '1',
                        organisationId: '1',
                        createdAt: faker.date.past(),
                        updatedAt: faker.date.recent(),
                    },
                ];
                dbiamPersonenKontextRepoMock.findByPerson.mockResolvedValue(personenkontexte);
                expect(await personenkontextService.findPersonenkontexteByPersonId('1')).toHaveLength(1);
            });
        });
    });

    describe('updatePersonenkontext', () => {
        describe('when personenkontext is updated successfully', () => {
            it('should return updated personenkontext', async () => {
                // AI next 19 lines
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true, {
                    revision: '1',
                });
                const personenkontextDoWithUpdatedRevision: PersonenkontextDo<true> = Object.assign(
                    {},
                    personenkontextDo,
                    {
                        revision: '2',
                    },
                );

                personenkontextRepoMock.findById.mockResolvedValue(personenkontextDo);
                personenkontextRepoMock.save.mockResolvedValue(personenkontextDoWithUpdatedRevision);

                const result: Result<
                    PersonenkontextDo<true>,
                    DomainError
                > = await personenkontextService.updatePersonenkontext(personenkontextDo);

                expect(result).toEqual<Result<PersonenkontextDo<true>, DomainError>>({
                    ok: true,
                    value: personenkontextDoWithUpdatedRevision,
                });
                expect(personenkontextRepoMock.save).toHaveBeenCalledWith(personenkontextDoWithUpdatedRevision);
            });
        });

        describe('when entity is not found', () => {
            it('should return EntityNotFoundError', async () => {
                const response: Result<
                    PersonenkontextDo<true>,
                    DomainError
                > = await personenkontextService.updatePersonenkontext({} as PersonenkontextDo<true>);

                // AI next 4 lines
                expect(response).toEqual<Result<PersonenkontextDo<true>, DomainError>>({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext'),
                });
            });
        });

        describe('when revision does not match', () => {
            it('should return MismatchedRevisionError', async () => {
                // AI next 20 lines
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const personenkontextDoWithWrongRevision: PersonenkontextDo<true> = {
                    ...personenkontextDo,
                    revision: 'wrongRevision',
                };

                personenkontextRepoMock.findById.mockResolvedValue(personenkontextDo);

                const result: Result<
                    PersonenkontextDo<true>,
                    DomainError
                > = await personenkontextService.updatePersonenkontext(personenkontextDoWithWrongRevision);

                expect(result).toEqual<Result<PersonenkontextDo<true>, DomainError>>({
                    ok: false,
                    error: new MismatchedRevisionError(
                        `Revision ${personenkontextDoWithWrongRevision.revision} does not match revision ${personenkontextDo.revision} of stored personenkontext.`,
                    ),
                });
            });
        });

        describe('when could not be stored', () => {
            it('should return EntityCouldNotBeUpdatedError', async () => {
                // AI next 14 lines
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);

                personenkontextRepoMock.findById.mockResolvedValue(personenkontextDo);
                personenkontextRepoMock.save.mockResolvedValue(null);

                const result: Result<
                    PersonenkontextDo<true>,
                    DomainError
                > = await personenkontextService.updatePersonenkontext(personenkontextDo);

                expect(result).toEqual<Result<PersonenkontextDo<true>, DomainError>>({
                    ok: false,
                    error: new EntityCouldNotBeUpdated('Personenkontext', personenkontextDo.id),
                });
            });
        });
    });

    describe('deletePersonenkontextById', () => {
        const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);

        describe('when personenkontext is deleted successfully', () => {
            it('should return void', async () => {
                personenkontextRepoMock.findById.mockResolvedValue(personenkontextDo);
                personenkontextRepoMock.deleteById.mockResolvedValue(1);

                const result: Result<void, DomainError> = await personenkontextService.deletePersonenkontextById(
                    personenkontextDo.id,
                    personenkontextDo.revision,
                );

                expect(result).toEqual<Result<void, DomainError>>({ ok: true, value: undefined });
                expect(personenkontextRepoMock.deleteById).toHaveBeenCalledWith(personenkontextDo.id);
            });
        });

        describe('when personenkontext entity is not found', () => {
            it('should return EntityNotFoundError', async () => {
                personenkontextRepoMock.findById.mockResolvedValue(null);

                const response: Result<void, DomainError> = await personenkontextService.deletePersonenkontextById(
                    personenkontextDo.id,
                    personenkontextDo.revision,
                );

                expect(response).toEqual<Result<void, DomainError>>({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext', personenkontextDo.id),
                });
            });
        });

        describe('when revision of personenkontext does not match', () => {
            it('should return MismatchedRevisionError', async () => {
                // AI next 11 lines
                personenkontextRepoMock.findById.mockResolvedValue(personenkontextDo);

                const result: Result<void, DomainError> = await personenkontextService.deletePersonenkontextById(
                    personenkontextDo.id,
                    '2',
                );

                expect(result).toEqual<Result<void, DomainError>>({
                    ok: false,
                    error: new MismatchedRevisionError('Personenkontext'),
                });
            });
        });

        describe('when personenkontext could not be deleted', () => {
            it('should return EntityCouldNotBeDeleted', async () => {
                // AI next 11 lines
                personenkontextRepoMock.findById.mockResolvedValue(personenkontextDo);
                personenkontextRepoMock.deleteById.mockResolvedValue(0);

                const response: Result<void, DomainError> = await personenkontextService.deletePersonenkontextById(
                    personenkontextDo.id,
                    personenkontextDo.revision,
                );

                expect(response).toEqual<Result<void, DomainError>>({
                    ok: false,
                    error: new EntityCouldNotBeDeleted('Personenkontext', personenkontextDo.id),
                });
            });
        });
    });
});
