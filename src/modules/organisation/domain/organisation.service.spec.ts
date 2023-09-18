import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationService } from './organisation.service.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { Mapper } from '@automapper/core';
import { OrganisationDo } from './organisation.do.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { Dictionary } from '@mikro-orm/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { IdWasSentWithPayload } from '../../../shared/error/id-was-sent-with-payload.error.js';

describe('OrganisationService', () => {
    let module: TestingModule;
    let organisationService: OrganisationService;
    let organisationRepoMock: DeepMocked<OrganisationRepo>;
    let mapperMock: DeepMocked<Mapper>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                OrganisationService,
                {
                    provide: OrganisationRepo,
                    useValue: createMock<OrganisationRepo>(),
                },
                {
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
            ],
        }).compile();
        organisationService = module.get(OrganisationService);
        organisationRepoMock = module.get(OrganisationRepo);
        mapperMock = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(organisationService).toBeDefined();
    });

    describe('createOrganisation', () => {
        it('should create an organisation', async () => {
            const organisationDo: OrganisationDo<false> = DoFactory.createOrganisation(false);
            organisationRepoMock.save.mockResolvedValue(organisationDo as unknown as OrganisationDo<true>);
            mapperMock.map.mockReturnValue(organisationDo as unknown as Dictionary<unknown>);
            const result: Result<OrganisationDo<true>> = await organisationService.createOrganisation(organisationDo);
            expect(result).toEqual<Result<OrganisationDo<true>>>({
                ok: true,
                value: organisationDo as unknown as OrganisationDo<true>,
            });
        });

        it('should return a domain error', async () => {
            const organisationDo: OrganisationDo<false> = DoFactory.createOrganisation(false);
            organisationDo.id = faker.string.uuid();
            const result: Result<OrganisationDo<true>> = await organisationService.createOrganisation(organisationDo);
            expect(result).toEqual<Result<OrganisationDo<true>>>({
                ok: false,
                error: new IdWasSentWithPayload(
                    `zu erstellende Organisation darf keien ID ${organisationDo.id} in der Payload haben`,
                ),
            });
        });
    });
});
