import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { PersonApiMapperProfile } from '../../person/api/person-api.mapper.profile.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';

describe('PersonenkontextUc', () => {
    let module: TestingModule;
    let sut: PersonenkontextUc;
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
        sut = module.get(PersonenkontextUc);
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
            it('should return CreatedPersonenkontextDto', async () => {
                const personenkontextDo: PersonenkontextDo<true> = DoFactory.createPersonenkontextDo(true);
                personenkontextServiceMock.createPersonenkontext.mockResolvedValue({
                    ok: true,
                    value: personenkontextDo,
                });

                const result: CreatedPersonenkontextDto | SchulConnexError = await sut.createPersonenkontext(
                    {} as CreatePersonenkontextDto,
                );

                expect(result).toBeInstanceOf(CreatedPersonenkontextDto);
            });
        });

        describe('when creation of personenkontext is not successful', () => {
            it('should return SchulConnexError', async () => {
                const error: EntityCouldNotBeCreated = new EntityCouldNotBeCreated('Personenkontext');
                personenkontextServiceMock.createPersonenkontext.mockResolvedValue({
                    ok: false,
                    error: error,
                });

                const result: CreatedPersonenkontextDto | SchulConnexError = await sut.createPersonenkontext(
                    {} as CreatePersonenkontextDto,
                );

                expect(result).toBeInstanceOf(SchulConnexError);
            });
        });
    });
});
