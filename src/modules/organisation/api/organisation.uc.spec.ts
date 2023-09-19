import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationUc } from './organisation.uc.js';
import { OrganisationService } from '../domain/organisation.service.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { IdIncludedWithPayload } from '../../../shared/error/id-included-with-payload.error.js';

describe('OrganisationUc', () => {
    let module: TestingModule;
    let organisationUc: OrganisationUc;
    let organisationServiceMock: DeepMocked<OrganisationService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                OrganisationUc,
                OrganisationApiMapperProfile,
                {
                    provide: OrganisationService,
                    useValue: createMock<OrganisationService>(),
                },
            ],
        }).compile();
        organisationUc = module.get(OrganisationUc);
        organisationServiceMock = module.get(OrganisationService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(organisationUc).toBeDefined();
    });

    describe('createOrganisation', () => {
        it('should create an organisation', async () => {
            organisationServiceMock.createOrganisation.mockResolvedValue({
                ok: true,
                value: DoFactory.createOrganisation(true),
            });
            await expect(organisationUc.createOrganisation({} as CreateOrganisationDto)).resolves.not.toThrow();
        });

        it('should throw an error', async () => {
            organisationServiceMock.createOrganisation.mockResolvedValue({
                ok: false,
                error: new IdIncludedWithPayload(''),
            });
            await expect(organisationUc.createOrganisation({} as CreateOrganisationDto)).rejects.toThrowError(
                IdIncludedWithPayload,
            );
        });
    });
});
