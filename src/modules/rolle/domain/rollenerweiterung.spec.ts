import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory } from '../../../../test/utils/index.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenerweiterungFactory } from './rollenerweiterung.factory.js';
import { Rollenerweiterung } from './rollenerweiterung.js';

describe('Rollenerweiterung Aggregate', () => {
    let module: TestingModule;
    let rollenerweiterungFactory: RollenerweiterungFactory;
    let organisationRepo: DeepMocked<OrganisationRepository>;
    let rolleRepo: DeepMocked<RolleRepo>;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                RollenerweiterungFactory,
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
            ],
        }).compile();
        rollenerweiterungFactory = module.get(RollenerweiterungFactory);
        organisationRepo = module.get(OrganisationRepository);
        rolleRepo = module.get(RolleRepo);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('checkReferences', () => {
        it('should return undefined, if references are valid', async () => {
            const rollenerweiterung: Rollenerweiterung<true> = rollenerweiterungFactory.construct(
                faker.string.uuid(),
                faker.date.anytime(),
                faker.date.anytime(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            organisationRepo.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            rolleRepo.findById.mockResolvedValueOnce(DoFactory.createRolle(true));
            serviceProviderRepoMock.findById.mockResolvedValueOnce(DoFactory.createServiceProvider(true));

            await expect(rollenerweiterung.checkReferences()).resolves.toBe(undefined);
        });

        type RollenerweiterungReference = 'organisation' | 'rolle' | 'serviceProvider';
        it.each([
            ['organisation' as RollenerweiterungReference],
            ['rolle' as RollenerweiterungReference],
            ['serviceProvider' as RollenerweiterungReference],
        ])('should return error, if %s reference is invalid', async (reference: RollenerweiterungReference) => {
            const rollenerweiterung: Rollenerweiterung<true> = rollenerweiterungFactory.construct(
                faker.string.uuid(),
                faker.date.anytime(),
                faker.date.anytime(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            organisationRepo.findById.mockResolvedValueOnce(
                reference === 'organisation' ? undefined : DoFactory.createOrganisation(true),
            );
            rolleRepo.findById.mockResolvedValueOnce(reference === 'rolle' ? undefined : DoFactory.createRolle(true));
            serviceProviderRepoMock.findById.mockResolvedValueOnce(
                reference === 'serviceProvider' ? undefined : DoFactory.createServiceProvider(true),
            );

            await expect(rollenerweiterung.checkReferences()).resolves.toBeInstanceOf(EntityNotFoundError);
        });
    });

    describe('getOrganisation', () => {
        it('should return organisation, if exists', async () => {
            const rollenerweiterung: Rollenerweiterung<true> = rollenerweiterungFactory.construct(
                faker.string.uuid(),
                faker.date.anytime(),
                faker.date.anytime(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            organisationRepo.findById.mockResolvedValueOnce(
                DoFactory.createOrganisation(true, { id: rollenerweiterung.organisationId }),
            );
            await expect(rollenerweiterung.getOrganisation()).resolves.toEqual(
                expect.objectContaining({ id: rollenerweiterung.organisationId }),
            );
        });
    });
});
