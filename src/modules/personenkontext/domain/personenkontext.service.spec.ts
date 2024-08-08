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
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { faker } from '@faker-js/faker';
import { PersonenkontextFactory } from './personenkontext.factory.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonenkontextQueryParams } from '../api/param/personenkontext-query.params.js';
import { UpdatePersonenkontextDto } from '../api/update-personenkontext.dto.js';

describe('PersonenkontextService', () => {
    let module: TestingModule;
    let personenkontextService: PersonenkontextService;
    let personenkontextRepoMock: DeepMocked<PersonenkontextRepo>;
    let personRepoMock: DeepMocked<PersonRepo>;
    let dbiamPersonenKontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let mapperMock: DeepMocked<Mapper>;

    let personenkontextFactory: PersonenkontextFactory;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonenkontextService,
                PersonenkontextFactory,
                {
                    provide: PersonenkontextRepo,
                    useValue: createMock<PersonenkontextRepo>(),
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
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
            ],
        }).compile();
        personenkontextService = module.get(PersonenkontextService);
        personenkontextRepoMock = module.get(PersonenkontextRepo);
        personRepoMock = module.get(PersonRepo);
        dbiamPersonenKontextRepoMock = module.get(DBiamPersonenkontextRepo);
        personenkontextFactory = module.get(PersonenkontextFactory);
        mapperMock = module.get(getMapperToken());
        personenkontextFactory = module.get(PersonenkontextFactory);
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
                const personenkontextDo: PersonenkontextDo<false> = DoFactory.createPersonenkontextDo(false);

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
                const personenkontextDo: PersonenkontextDo<false> = DoFactory.createPersonenkontextDo(false);

                personRepoMock.findById.mockResolvedValueOnce(createMock<PersonDo<true>>());
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
                const personenkontextDo: PersonenkontextDo<false> = DoFactory.createPersonenkontextDo(false);

                personRepoMock.findById.mockResolvedValueOnce(createMock<PersonDo<true>>());

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
                const personenkontext1: Personenkontext<false> = DoFactory.createPersonenkontext(false);
                const personenkontext2: Personenkontext<false> = DoFactory.createPersonenkontext(false);
                const personenkontexte: Personenkontext<true>[] = [
                    personenkontext1 as unknown as Personenkontext<true>,
                    personenkontext2 as unknown as Personenkontext<true>,
                ];
                dbiamPersonenKontextRepoMock.findBy.mockResolvedValue([personenkontexte, personenkontexte.length]);
                mapperMock.map.mockReturnValue(personenkontexte as unknown as Dictionary<unknown>);
                const personenkontextDoWithQueryParam: PersonenkontextQueryParams = new PersonenkontextQueryParams();

                const result: Paged<Personenkontext<true>> = await personenkontextService.findAllPersonenkontexte(
                    personenkontextDoWithQueryParam,
                );

                expect(result).toEqual<Paged<Personenkontext<true>>>({
                    items: personenkontexte,
                    total: personenkontexte.length,
                    offset: 0,
                    limit: personenkontexte.length,
                });
            });
        });

        describe('When no personenkontexte are found', () => {
            it('should return a result with an empty array', async () => {
                const personenkontext: Personenkontext<false> = DoFactory.createPersonenkontext(false);
                dbiamPersonenKontextRepoMock.findBy.mockResolvedValue([[], 0]);
                mapperMock.map.mockReturnValue(personenkontext as unknown as Dictionary<unknown>);

                const result: Paged<Personenkontext<true>> = await personenkontextService.findAllPersonenkontexte(
                    new PersonenkontextQueryParams(),
                );

                expect(result).toEqual<Paged<Personenkontext<true>>>({
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
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);

                dbiamPersonenKontextRepoMock.findByID.mockResolvedValue(personenkontext);

                const result: Result<
                    Personenkontext<true>,
                    DomainError
                > = await personenkontextService.findPersonenkontextById(personenkontext.id);

                expect(result).toStrictEqual({ ok: true, value: personenkontext });
            });
        });

        describe('when NOT finding personenkontext with given id', () => {
            it('should return domain error', async () => {
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);

                dbiamPersonenKontextRepoMock.findByID.mockResolvedValue(null);

                const result: Result<
                    Personenkontext<true>,
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
                    personenkontextFactory.construct('1', faker.date.past(), faker.date.recent(), '', '1', '1', '1'),
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
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                    revision: '1',
                });
                const personenkontextDoWithUpdatedRevision: Personenkontext<true> = Object.assign({}, personenkontext, {
                    revision: '2',
                });

                dbiamPersonenKontextRepoMock.findByID.mockResolvedValue(personenkontext);
                dbiamPersonenKontextRepoMock.save.mockResolvedValue(personenkontextDoWithUpdatedRevision);

                const result: Result<
                    Personenkontext<true>,
                    DomainError
                > = await personenkontextService.updatePersonenkontext(personenkontext);

                expect(result).toEqual<Result<Personenkontext<true>, DomainError>>({
                    ok: true,
                    value: personenkontextDoWithUpdatedRevision,
                });
            });
        });

        describe('when entity is not found', () => {
            it('should return EntityNotFoundError', async () => {
                const response: Result<
                    Personenkontext<true>,
                    DomainError
                > = await personenkontextService.updatePersonenkontext({} as UpdatePersonenkontextDto);

                // AI next 4 lines
                expect(response).toEqual<Result<Personenkontext<true>, DomainError>>({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext'),
                });
            });
        });

        describe('when revision does not match', () => {
            it('should return MismatchedRevisionError', async () => {
                // AI next 20 lines
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);
                const personenkontextDoWithWrongRevision: Personenkontext<true> = Object.assign({}, personenkontext, {
                    revision: 'wrongRevision',
                });

                dbiamPersonenKontextRepoMock.findByID.mockResolvedValue(personenkontext);

                const result: Result<
                    Personenkontext<true>,
                    DomainError
                > = await personenkontextService.updatePersonenkontext(personenkontextDoWithWrongRevision);

                expect(result).toEqual<Result<Personenkontext<true>, DomainError>>({
                    ok: false,
                    error: new MismatchedRevisionError(
                        `Revision ${personenkontextDoWithWrongRevision.revision} does not match revision ${personenkontext.revision} of stored personenkontext.`,
                    ),
                });
            });
        });

        describe('when could not be stored', () => {
            it('should return EntityCouldNotBeUpdatedError', async () => {
                // AI next 14 lines
                const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);

                dbiamPersonenKontextRepoMock.findByID.mockResolvedValue(personenkontext);
                dbiamPersonenKontextRepoMock.save.mockResolvedValueOnce(undefined as unknown as Personenkontext<true>);

                const result: Result<
                    Personenkontext<true>,
                    DomainError
                > = await personenkontextService.updatePersonenkontext(personenkontext);

                expect(result).toEqual<Result<Personenkontext<true>, DomainError>>({
                    ok: false,
                    error: new EntityCouldNotBeUpdated('Personenkontext', personenkontext.id),
                });
            });
        });
    });

    describe('deletePersonenkontextById', () => {
        const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true);

        describe('when personenkontext is deleted successfully', () => {
            it('should return void', async () => {
                dbiamPersonenKontextRepoMock.findByID.mockResolvedValue(personenkontext);
                dbiamPersonenKontextRepoMock.deleteById.mockResolvedValue(true);

                const result: Result<void, DomainError> = await personenkontextService.deletePersonenkontextById(
                    personenkontext.id,
                    personenkontext.revision,
                );

                expect(result).toEqual<Result<void, DomainError>>({ ok: true, value: undefined });
            });
        });

        describe('when personenkontext entity is not found', () => {
            it('should return EntityNotFoundError', async () => {
                dbiamPersonenKontextRepoMock.findByID.mockResolvedValue(null);

                const response: Result<void, DomainError> = await personenkontextService.deletePersonenkontextById(
                    personenkontext.id,
                    personenkontext.revision,
                );

                expect(response).toEqual<Result<void, DomainError>>({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext', personenkontext.id),
                });
            });
        });

        describe('when revision of personenkontext does not match', () => {
            it('should return MismatchedRevisionError', async () => {
                // AI next 11 lines
                dbiamPersonenKontextRepoMock.findByID.mockResolvedValue(personenkontext);

                const result: Result<void, DomainError> = await personenkontextService.deletePersonenkontextById(
                    personenkontext.id,
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
                dbiamPersonenKontextRepoMock.findByID.mockResolvedValue(personenkontext);
                dbiamPersonenKontextRepoMock.deleteById.mockResolvedValue(false);

                const response: Result<void, DomainError> = await personenkontextService.deletePersonenkontextById(
                    personenkontext.id,
                    personenkontext.revision,
                );

                expect(response).toEqual<Result<void, DomainError>>({
                    ok: false,
                    error: new EntityCouldNotBeDeleted('Personenkontext', personenkontext.id),
                });
            });
        });
    });
});
