import { Dictionary, Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { PersonenkontextRepo } from '../persistence/personenkontext.repo.js';
import { PersonenkontextDo } from './personenkontext.do.js';
import { PersonenkontextService } from './personenkontext.service.js';

describe('PersonenkontextService', () => {
    let module: TestingModule;
    let personenkontextService: PersonenkontextService;
    let personenkontextRepoMock: DeepMocked<PersonenkontextRepo>;
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
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
            ],
        }).compile();
        personenkontextService = module.get(PersonenkontextService);
        personenkontextRepoMock = module.get(PersonenkontextRepo);
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
        describe('when personenkontext is saved successfully', () => {
            it('should create an Personenkontext', async () => {
                const personenkontextDo: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);
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
            it('should return a domain error', async () => {
                const personenkontextDo: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);
                const result: Result<PersonenkontextDo<true>> = await personenkontextService.createPersonenkontext(
                    personenkontextDo,
                );
                expect(result).toEqual<Result<PersonenkontextDo<true>>>({
                    ok: false,
                    error: new EntityCouldNotBeCreated(`Personenkontext`),
                });
            });
        });
    });
});
