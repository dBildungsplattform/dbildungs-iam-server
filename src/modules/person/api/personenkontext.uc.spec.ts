import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonService } from '../domain/person.service.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { Personenstatus, Rolle } from '../domain/personenkontext.enums.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from './find-personenkontext-by-id.dto.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { SichtfreigabeType } from './personen-query.param.js';
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
                    ok: true,
                    value: personenkontexte,
                });

                const result: PersonenkontextDto[] = await sut.findAll(findPersonenkontextDto);
                expect(result).toHaveLength(2);
            });

            it('should throw EntityNotFoundError when no matching persons are found', async () => {
                const findPersonenkontextDto: FindPersonenkontextDto = {
                    personId: faker.string.uuid(),
                    referrer: 'referrer',
                    sichtfreigabe: SichtfreigabeType.NEIN,
                    personenstatus: Personenstatus.AKTIV,
                    rolle: Rolle.LERNENDER,
                };

                const emptyResult: Result<PersonenkontextDo<true>[], DomainError> = {
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext'),
                };
                personenkontextServiceMock.findAllPersonenkontexte.mockResolvedValue(emptyResult);
                await expect(sut.findAll(findPersonenkontextDto)).rejects.toThrow(EntityNotFoundError);
            });
        });
    });

    describe('findById', () => {
        describe('when finding personenkontext with id', () => {
            it('should return personenkontext', async () => {
                const personDo: PersonDo<true> = DoFactory.createPerson(true);
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                const dto: FindPersonenkontextByIdDto = {
                    personenkontextId: personenkontextDo.id,
                };

                personServiceMock.findPersonById.mockResolvedValue({ ok: true, value: personDo });
                personenkontextServiceMock.findById.mockResolvedValue({ ok: true, value: personenkontextDo });

                await expect(sut.findById(dto)).resolves.not.toThrow();
            });
        });

        describe('when NOT finding personenkontext with id', () => {
            it('should throw domain error', async () => {
                const dto: FindPersonenkontextByIdDto = {
                    personenkontextId: faker.string.uuid(),
                };

                personenkontextServiceMock.findById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext'),
                });

                await expect(sut.findById(dto)).rejects.toThrow(EntityNotFoundError);
            });
        });
    });
});
