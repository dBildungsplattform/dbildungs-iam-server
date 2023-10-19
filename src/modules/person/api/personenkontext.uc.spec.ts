import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { SichtfreigabeType } from './personen-query.param.js';
import { Personenstatus, Rolle } from '../domain/personenkontext.enums.js';
import { PersonenkontextResponse } from './personenkontext.response.js';
import { faker } from '@faker-js/faker';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';

describe('PersonenkontextUc', () => {
    let module: TestingModule;
    let personenkontextUc: PersonenkontextUc;
    let personenkontextServiceMock: DeepMocked<PersonenkontextService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonenkontextUc,
                PersonApiMapperProfile,
                {
                    provide: PersonenkontextService,
                    useValue: createMock<PersonenkontextService>(),
                },
            ],
        }).compile();
        personenkontextUc = module.get(PersonenkontextUc);
        personenkontextServiceMock = module.get(PersonenkontextService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(personenkontextUc).toBeDefined();
    });

    describe('createPersonenkontext', () => {
        describe('when creation of personenkontext is successful', () => {
            it('should not throw', async () => {
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);
                personenkontextServiceMock.createPersonenkontext.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });

                const createPersonPromise: Promise<CreatedPersonenkontextDto> = personenkontextUc.createPersonenkontext(
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

                const createPersonPromise: Promise<CreatedPersonenkontextDto> = personenkontextUc.createPersonenkontext(
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

                const result: PersonenkontextResponse[] = await personenkontextUc.findAll(findPersonenkontextDto);
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
                await expect(personenkontextUc.findAll(findPersonenkontextDto)).rejects.toThrow(EntityNotFoundError);
            });
        });
    });

    describe('findById', () => {
        describe('when finding personenkontext with id', () => {
            it('should return personenkontext', async () => {
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true);

                personenkontextServiceMock.findById.mockResolvedValue({ ok: true, value: personenkontextDo });

                await expect(personenkontextUc.findById(personenkontextDo.id)).resolves.not.toThrow();
            });
        });

        describe('when NOT finding personenkontext with id', () => {
            it('should throw domain error', async () => {
                personenkontextServiceMock.findById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError('Personenkontext'),
                });

                await expect(personenkontextUc.findById(faker.string.uuid())).rejects.toThrow(EntityNotFoundError);
            });
        });
    });
});
