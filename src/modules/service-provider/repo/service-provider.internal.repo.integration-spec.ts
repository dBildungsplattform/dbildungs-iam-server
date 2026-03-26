import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';

import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    LoggingTestModule,
} from '../../../../test/utils';
import { createAndPersistServiceProvider } from '../../../../test/utils/service-provider-test-helper';
import { ServiceProvider } from '../domain/service-provider';
import { ServiceProviderInternalRepo } from './service-provider.internal.repo';

describe('ServiceProviderInternalRepo', () => {
    let module: TestingModule;
    let sut: ServiceProviderInternalRepo;

    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), LoggingTestModule],
            providers: [ServiceProviderInternalRepo],
        }).compile();

        sut = module.get(ServiceProviderInternalRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
        expect(em).toBeDefined();
    });

    describe('existsDuplicateNameForOrganisation', () => {
        it('should return true, if a serviceprovider with the same name at the same orga already exists', async () => {
            const name: string = faker.string.alphanumeric();
            const providedOnSchulstrukturknoten: string = faker.string.uuid();

            await createAndPersistServiceProvider(em, { name, providedOnSchulstrukturknoten });

            const promise: Promise<boolean> = sut.existsDuplicateNameForOrganisation(
                name,
                providedOnSchulstrukturknoten,
                undefined,
            );

            await expect(promise).resolves.toBe(true);
        });

        it('should return false, if no serviceprovider with the same name at the same orga already exists', async () => {
            const name: string = faker.string.alphanumeric();
            const orgaA: string = faker.string.uuid();
            const orgaB: string = faker.string.uuid();

            await createAndPersistServiceProvider(em, { name, providedOnSchulstrukturknoten: orgaA });

            const promise: Promise<boolean> = sut.existsDuplicateNameForOrganisation(name, orgaB, undefined);

            await expect(promise).resolves.toBe(false);
        });

        it('should ignore the serviceprovider with the given id', async () => {
            const sp: ServiceProvider<true> = await createAndPersistServiceProvider(em);

            const promise: Promise<boolean> = sut.existsDuplicateNameForOrganisation(
                sp.name,
                sp.providedOnSchulstrukturknoten,
                sp.id,
            );

            await expect(promise).resolves.toBe(false);
        });
    });
});
