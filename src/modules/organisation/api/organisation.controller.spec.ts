import { MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.js';
import { OrganisationController } from './organisation.controller.js';
import { OrganisationUc } from './organisation.uc.js';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { OrganisationsTyp } from '../domain/organisation.enum.js';
import { faker } from '@faker-js/faker';
import { CreateOrganisationDto } from './create-organisation.dto.js';

describe('OrganisationController', () => {
    let module: TestingModule;
    let organisationController: OrganisationController;
    let organisationUcMock: DeepMocked<OrganisationUc>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                OrganisationController,
                OrganisationApiMapperProfile,
                {
                    provide: OrganisationUc,
                    useValue: createMock<OrganisationUc>(),
                },
            ],
        }).compile();
        organisationController = module.get(OrganisationController);
        organisationUcMock = module.get(OrganisationUc);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(organisationController).toBeDefined();
    });

    describe('createOrganisation', () => {
        it('should not throw an error', async () => {
            const params: CreateOrganisationBodyParams = {
                kennung: faker.lorem.word(),
                name: faker.lorem.word(),
                namensergaenzung: faker.lorem.word(),
                kuerzel: faker.lorem.word(),
                typ: OrganisationsTyp.SONSTIGE,
            };

            const returnedValue: CreateOrganisationDto = {
                id: faker.string.uuid(),
                kennung: faker.lorem.word(),
                name: faker.lorem.word(),
                namensergaenzung: faker.lorem.word(),
                kuerzel: faker.lorem.word(),
                typ: OrganisationsTyp.SONSTIGE,
            };
            organisationUcMock.createOrganisation.mockResolvedValue(returnedValue);
            await expect(organisationController.createOrganisation(params)).resolves.not.toThrow();
            expect(organisationUcMock.createOrganisation).toHaveBeenCalledTimes(1);
        });
    });
});
