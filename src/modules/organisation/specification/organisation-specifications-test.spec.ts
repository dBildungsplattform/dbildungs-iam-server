import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { MikroORM } from '@mikro-orm/core';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { AdministriertVonTraeger } from './administriert-von-traeger.js';
import { OrganisationPersistenceMapperProfile } from '../persistence/organisation-persistence.mapper.profile.js';
import { IstSchule } from './ist-schule.js';
import { IstTraeger } from './ist-traeger.js';
import { ZugehoerigZuSchule } from './zugehoerig-zu-schule.js';
import { ZugehoerigZuTraeger } from './zugehoerig-zu-traeger.js';

describe('OrganisationSpecificationTests', () => {
    let module: TestingModule;
    let repo: OrganisationRepo;
    let orm: MikroORM;

    let schule1: OrganisationDo<true>;
    let traeger1: OrganisationDo<true>;
    let schule2: OrganisationDo<true>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [OrganisationPersistenceMapperProfile, OrganisationRepo],
        }).compile();
        repo = module.get(OrganisationRepo);
        orm = module.get(MikroORM);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);

        const traeger: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
            name: 'Traeger1',
            typ: OrganisationsTyp.SONSTIGE,
        });
        traeger1 = await repo.save(traeger);
        let schule: OrganisationDo<false> = DoFactory.createOrganisation(false, {
            name: 'Schule1',
            typ: OrganisationsTyp.SCHULE,
            administriertVon: traeger1.id,
            zugehoerigZu: traeger1.id,
        });
        schule1 = await repo.save(schule);
        schule = DoFactory.createOrganisation(false, {
            name: 'Schule2',
            typ: OrganisationsTyp.SCHULE,
            administriertVon: schule1.id,
            zugehoerigZu: schule1.id,
        });
        schule2 = await repo.save(schule);
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('administriert-von-traeger', () => {
        it('should be satisfied when administriertVon-property is Traeger', async () => {
            const administriertVonTraeger: AdministriertVonTraeger = new AdministriertVonTraeger(repo);
            expect(await administriertVonTraeger.isSatisfiedBy(schule1)).toBeTruthy();
        });
        it('should not be satisfied when administriertVon-property is not a Traeger', async () => {
            const administriertVonTraeger: AdministriertVonTraeger = new AdministriertVonTraeger(repo);
            expect(await administriertVonTraeger.isSatisfiedBy(schule2)).toBeFalsy();
        });
    });

    describe('ist-schule', () => {
        it('should be satisfied when typ is SCHULE', async () => {
            const istSchule: IstSchule = new IstSchule();
            expect(await istSchule.isSatisfiedBy(schule1)).toBeTruthy();
        });
        it('should not be satisfied when typ is not SCHULE', async () => {
            const istSchule: IstSchule = new IstSchule();
            expect(await istSchule.isSatisfiedBy(traeger1)).toBeFalsy();
        });
    });

    describe('ist-traeger', () => {
        it('should be satisfied when typ is TRAEGER', async () => {
            const istTraeger: IstTraeger = new IstTraeger();
            expect(await istTraeger.isSatisfiedBy(traeger1)).toBeTruthy();
        });
        it('should not be satisfied when typ is not TRAEGER', async () => {
            const istTraeger: IstTraeger = new IstTraeger();
            expect(await istTraeger.isSatisfiedBy(schule1)).toBeFalsy();
        });
    });

    describe('ist-zugehoerig-zu-schule', () => {
        it('should be satisfied when zugehoerigZu is referencing an organisation with type SCHULE', async () => {
            const zugehoerigZuSchule: ZugehoerigZuSchule = new ZugehoerigZuSchule(repo);
            expect(await zugehoerigZuSchule.isSatisfiedBy(schule2)).toBeTruthy();
        });
        it('should not be satisfied when zugehoerigZu is referencing an organisation with type other than SCHULE', async () => {
            const zugehoerigZuSchule: ZugehoerigZuSchule = new ZugehoerigZuSchule(repo);
            expect(await zugehoerigZuSchule.isSatisfiedBy(schule1)).toBeFalsy();
        });
    });

    describe('ist-zugehoerig-zu-traeger', () => {
        it('should be satisfied when zugehoerigZu is referencing an organisation with type TRAEGER', async () => {
            const zugehoerigZuTraeger: ZugehoerigZuTraeger = new ZugehoerigZuTraeger(repo);
            expect(await zugehoerigZuTraeger.isSatisfiedBy(schule1)).toBeTruthy();
        });
        it('should not be satisfied when zugehoerigZu is referencing an organisation with type other than TRAEGER', async () => {
            const zugehoerigZuTraeger: ZugehoerigZuTraeger = new ZugehoerigZuTraeger(repo);
            expect(await zugehoerigZuTraeger.isSatisfiedBy(schule2)).toBeFalsy();
        });
    });
});
