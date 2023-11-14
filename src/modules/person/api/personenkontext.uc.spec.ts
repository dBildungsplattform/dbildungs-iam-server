import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonService } from '../domain/person.service.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from './find-personenkontext-by-id.dto.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonenkontextDto } from './personenkontext.dto.js';
import { PersonenkontextUc } from './personenkontext.uc.js';

describe('PersonenkontextUc', () => {
    let module: TestingModule;
    let sut: PersonenkontextUc;
    let personServiceMock: DeepMocked<PersonService>;
    let personenkontextServiceMock: DeepMocked<PersonenkontextService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonenkontextUc,
                PersonApiMapperProfile,
                {
                    provide: PersonService,
                    useValue: createMock<PersonService>(),
                },
                {
                    provide: PersonenkontextService,
                    useValue: createMock<PersonenkontextService>(),
                },
            ],
        }).compile();
        sut = module.get(PersonenkontextUc);
        personServiceMock = module.get(PersonService);
        personenkontextServiceMock = module.get(PersonenkontextService);
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

    describe('createPersonenkontext', () => {
        describe('when creation of personenkontext is successful', () => {
            it('should not throw', async () => {
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                personenkontextServiceMock.createPersonenkontext.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });

                const createPersonPromise: Promise<CreatedPersonenkontextDto> = sut.createPersonenkontext(
                    {} as CreatePersonenkontextDto,
                );

                await expect(createPersonPromise).resolves.not.toThrow();
            });
        });

        describe('when creation of personenkontext is not successful', () => {
            it('should throw Error', async () => {
                const error: EntityCouldNotBeCreated = new EntityCouldNotBeCreated('Personenkontext');
                personenkontextServiceMock.createPersonenkontext.mockResolvedValue({
                    ok: false,
                    error: error,
                });

                const createPersonPromise: Promise<CreatedPersonenkontextDto> = sut.createPersonenkontext(
                    {} as CreatePersonenkontextDto,
                );

                await expect(createPersonPromise).rejects.toThrow(error);
            });
        });
    });

    describe('findAll', () => {
        describe('When searching for personenkontexte', () => {
            it('should find all persons that match with query param', async () => {
                const findPersonenkontextDto: FindPersonenkontextDto = {
                    personId: faker.string.uuid(),
                    referrer: 'referrer',
                    sichtfreigabe: SichtfreigabeType.NEIN,
                    personenstatus: Personenstatus.AKTIV,
                    rolle: Rolle.LERNENDER,
                };

                const firstPersonenkontext: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const secondPersonenkontext: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const personenkontexte: PersonenkontextDo<true>[] = [firstPersonenkontext, secondPersonenkontext];
                personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue({
                    items: personenkontexte,
                    total: personenkontexte.length,
                    limit: personenkontexte.length,
                    offset: 0,
                });

                const result: Paged<PersonenkontextDto> = await sut.findAll(findPersonenkontextDto);
                expect(result.items).toHaveLength(2);
            });

            it('should return empty array when no matching persons are found', async () => {
                const findPersonenkontextDto: FindPersonenkontextDto = {
                    personId: faker.string.uuid(),
                    referrer: 'referrer',
                    sichtfreigabe: SichtfreigabeType.NEIN,
                    personenstatus: Personenstatus.AKTIV,
                    rolle: Rolle.LERNENDER,
                };

                const emptyResult: Paged<PersonenkontextDo<true>> = {
                    items: [],
                    total: 0,
                    limit: 0,
                    offset: 0,
                };
                personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue(emptyResult);

                const result: Paged<PersonenkontextDto> = await sut.findAll(findPersonenkontextDto);

                expect(result.items).toHaveLength(0);
            });
        });
    });

    describe('findPersonenkontextById', () => {
        describe('when finding personenkontext with id', () => {
            it('should return personenkontext', async () => {
                const personDo: PersonDo<true> = DoFactory.createPerson(true);
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const dto: FindPersonenkontextByIdDto = {
                    personenkontextId: personenkontextDo.id,
                };

                personServiceMock.findPersonById.mockResolvedValue({ ok: true, value: personDo });
                personenkontextServiceMock.findPersonenkontextById.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });

                await expect(sut.findPersonenkontextById(dto)).resolves.not.toThrow();
            });
        });

        describe('when NOT finding personenkontext with id', () => {
            it('should throw domain error for personenkontext not found', async () => {
                const dto: FindPersonenkontextByIdDto = {
                    personenkontextId: faker.string.uuid(),
                };

                personenkontextServiceMock.findPersonenkontextById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext'),
                });

                await expect(sut.findPersonenkontextById(dto)).rejects.toThrow(EntityNotFoundError);
            });

            // AI next 13 lines
            it('should throw domain error for person not found', async () => {
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const dto: FindPersonenkontextByIdDto = {
                    personenkontextId: personenkontextDo.id,
                };

                personenkontextServiceMock.findPersonenkontextById.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError('Person'),
                });

                await expect(sut.findPersonenkontextById(dto)).rejects.toThrow(EntityNotFoundError);
            });
        });
    });
});
