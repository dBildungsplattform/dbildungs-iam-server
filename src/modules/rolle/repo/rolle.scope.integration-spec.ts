import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    EventSystemTestModule,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { RollenArt, RollenMerkmal } from '../domain/rolle.enums.js';
import { Rolle } from '../domain/rolle.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleModule } from '../rolle.module.js';
import { RolleRepo } from './rolle.repo.js';
import { RolleScope } from './rolle.scope.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';

describe('RolleScope', () => {
    let module: TestingModule;
    let orm: MikroORM;
    let em: EntityManager;
    let rolleRepo: RolleRepo;
    let spRepo: ServiceProviderRepo;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                LoggingTestModule,
                EventSystemTestModule,
                RolleModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
            ],
        }).compile();
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        rolleRepo = module.get(RolleRepo);
        spRepo = module.get(ServiceProviderRepo);
        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('executeQuery', () => {
        it('should return entities with populated relations', async () => {
            const sps: ServiceProvider<true>[] = await Promise.all([
                spRepo.create(DoFactory.createServiceProvider(false)),
                spRepo.create(DoFactory.createServiceProvider(false)),
            ]);
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    merkmale: [RollenMerkmal.BEFRISTUNG_PFLICHT, RollenMerkmal.KOPERS_PFLICHT],
                    serviceProviderIds: sps.map((sp: ServiceProvider<true>) => sp.id),
                }),
            );
            if (rolle instanceof DomainError) {
                throw rolle;
            }
            const scope: RolleScope = new RolleScope();
            const [rollen]: Counted<RolleEntity> = await scope.executeQuery(em);
            expect(rollen).toHaveLength(1);
            const fetchedRolle: RolleEntity = rollen[0]!;
            expect(fetchedRolle.merkmale).toHaveLength(2);
            expect(fetchedRolle.serviceProvider).toHaveLength(2);
            expect(fetchedRolle.serviceProvider[0]!.serviceProvider.id).toEqual(sps[0]!.id);
            expect(fetchedRolle.serviceProvider[1]!.serviceProvider.id).toEqual(sps[1]!.id);
        });
    });

    describe('findByRollenArten', () => {
        beforeEach(async () => {
            const promises: Promise<Rolle<true> | DomainError>[] = [
                DoFactory.createRolle(false, { rollenart: RollenArt.SYSADMIN }),
                DoFactory.createRolle(false, { rollenart: RollenArt.LEHR }),
                DoFactory.createRolle(false, { rollenart: RollenArt.LERN }),
            ].map((r: Rolle<false>) => rolleRepo.save(r));
            await Promise.all(promises);
        });

        it('should return only roles with the specified rollenArten', async () => {
            const scope: RolleScope = new RolleScope().findByRollenArten([RollenArt.SYSADMIN, RollenArt.LERN]);
            const [rollen]: Counted<RolleEntity> = await scope.executeQuery(em);
            expect(rollen).toHaveLength(2);
            const foundArten: RollenArt[] = rollen.map((r: RolleEntity) => r.rollenart);
            expect(foundArten).toEqual(expect.arrayContaining([RollenArt.SYSADMIN, RollenArt.LERN]));
        });

        it('should skip if rollenarten are empty', async () => {
            const scope: RolleScope = new RolleScope().findByRollenArten([]);
            const [rollen]: Counted<RolleEntity> = await scope.executeQuery(em);
            expect(rollen).toHaveLength(3);
        });
    });

    describe('findByOrganisationen', () => {
        let orgaIds: string[] = [];
        beforeEach(async () => {
            // Create 3 roles, each administered by a different organisation
            const rollen: Rolle<true>[] = (
                await Promise.all([
                    rolleRepo.save(DoFactory.createRolle(false)),
                    rolleRepo.save(DoFactory.createRolle(false)),
                    rolleRepo.save(DoFactory.createRolle(false)),
                ])
            ).filter((r: Rolle<true> | DomainError): r is Rolle<true> => !(r instanceof DomainError));
            orgaIds = rollen.map((r: Rolle<true>) => r.administeredBySchulstrukturknoten);
        });

        it('should return only roles administered by the specified organisations', async () => {
            const scope: RolleScope = new RolleScope().findByOrganisationen([orgaIds[0]!, orgaIds[2]!]);
            const [rollen]: Counted<RolleEntity> = await scope.executeQuery(em);
            expect(rollen).toHaveLength(2);
            const foundOrgaIds: OrganisationID[] = rollen.map((r: RolleEntity) => r.administeredBySchulstrukturknoten);
            expect(foundOrgaIds).toEqual(expect.arrayContaining([orgaIds[0], orgaIds[2]]));
        });

        it('should skip if ids are empty', async () => {
            const scope: RolleScope = new RolleScope().findByOrganisationen([]);
            const [rollen]: Counted<RolleEntity> = await scope.executeQuery(em);
            expect(rollen).toHaveLength(3);
        });
    });

    describe('setIncludeTechnische', () => {
        beforeEach(async () => {
            const rollen: Promise<Rolle<true> | DomainError>[] = [
                DoFactory.createRolle(false, { istTechnisch: true }),
                DoFactory.createRolle(false, { istTechnisch: false }),
            ].map((r: Rolle<false>) => rolleRepo.save(r));
            await Promise.all(rollen);
        });

        it('should exclude technische Rollen by default', async () => {
            const scope: RolleScope = new RolleScope();
            const [rollen]: Counted<RolleEntity> = await scope.executeQuery(em);
            expect(rollen.every((r: RolleEntity) => r.istTechnisch === false)).toBe(true);
        });

        it('should include technische Rollen when setIncludeTechnische(true) is called', async () => {
            const scope: RolleScope = new RolleScope().setIncludeTechnische(true);
            const [rollen]: Counted<RolleEntity> = await scope.executeQuery(em);
            expect(rollen.some((r: RolleEntity) => r.istTechnisch === true)).toBe(true);
            expect(rollen.some((r: RolleEntity) => r.istTechnisch === false)).toBe(true);
        });
    });
});
