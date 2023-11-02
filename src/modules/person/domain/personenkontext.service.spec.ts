import { Dictionary, Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonenkontextRepo } from '../persistence/personenkontext.repo.js';
import { PersonenkontextDo } from './personenkontext.do.js';
import { PersonenkontextService } from './personenkontext.service.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { PersonDo } from './person.do.js';

describe('PersonenkontextService', () => {
    let module: TestingModule;
    let personenkontextService: PersonenkontextService;
    let personenkontextRepoMock: DeepMocked<PersonenkontextRepo>;
    let personRepoMock: DeepMocked<PersonRepo>;
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
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
            ],
        }).compile();
        personenkontextService = module.get(PersonenkontextService);
        personenkontextRepoMock = module.get(PersonenkontextRepo);
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
                const result: Result<PersonenkontextDo<true>> = await personenkontextService.createPersonenkontext(
                    personenkontextDo,
                );
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
                personenkontextRepoMock.findAll.mockResolvedValue(personenkontexte);
                mapperMock.map.mockReturnValue(personenkontexte as unknown as Dictionary<unknown>);
                const personenkontextDoWithQueryParam: PersonenkontextDo<false> =
                    DoFactory.createPersonenkontext(false);

                const result: Result<PersonenkontextDo<true>[], DomainError> =
                    await personenkontextService.findAllPersonenkontexte(personenkontextDoWithQueryParam);
                expect(result).toEqual<Result<PersonenkontextDo<true>[], DomainError>>({
                    ok: true,
                    value: personenkontexte,
                });
            });
        });

        describe('When no personenkontexte are found', () => {
            it('should return a result with an empty array', async () => {
                const personenkontext: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);
                personenkontextRepoMock.findAll.mockResolvedValue([]);
                mapperMock.map.mockReturnValue(personenkontext as unknown as Dictionary<unknown>);
                const result: Result<PersonenkontextDo<true>[], DomainError> =
                    await personenkontextService.findAllPersonenkontexte(personenkontext);
                expect(result).toEqual<Result<PersonenkontextDo<true>[], DomainError>>({
                    ok: true,
                    value: [],
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
});
