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
});
