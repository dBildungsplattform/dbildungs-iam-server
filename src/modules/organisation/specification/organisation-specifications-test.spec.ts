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
import { AdministriertVonSchule } from './administriert-von-schule.js';
import { AdministriertZyklus } from './administriert-zyklus.js';
import { SchuleZuTraeger } from './schule-zu-traeger.js';
import { TraegerZuTraeger } from './traeger-zu-traeger.js';

describe('OrganisationSpecificationTests', () => {
    let module: TestingModule;
    let repo: OrganisationRepo;
    let orm: MikroORM;

    let schule1: OrganisationDo<true>;
    let schule2: OrganisationDo<true>;
    let traeger1: OrganisationDo<true>;
    let traeger2: OrganisationDo<true>;
    let traeger3: OrganisationDo<true>;

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

        let traeger: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
            id: 'a10852ab-1d75-45a7-9421-b1cbd8abe693',
            name: 'Traeger1',
            typ: OrganisationsTyp.TRAEGER,
            administriertVon: undefined,
        });
        traeger1 = await repo.save(traeger);
        traeger = DoFactory.createOrganisation(false, {
            id: '2',
            name: 'Traeger2',
            typ: OrganisationsTyp.TRAEGER,
            administriertVon: traeger1.id,
        });
        traeger2 = await repo.save(traeger);
        traeger = DoFactory.createOrganisation(false, {
            id: '3',
            name: 'Traeger3',
            typ: OrganisationsTyp.TRAEGER,
            administriertVon: traeger2.id,
        });
        traeger3 = await repo.save(traeger);
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

    describe('administriert-von-schule', () => {
        it('should be satisfied when administriertVon-property is Schule', async () => {
            const administriertVonSchule: AdministriertVonSchule = new AdministriertVonSchule(repo);
            expect(await administriertVonSchule.isSatisfiedBy(schule1)).toBeFalsy();
        });
        it('should not be satisfied when administriertVon-property is not a Schule', async () => {
            const administriertVonSchule: AdministriertVonSchule = new AdministriertVonSchule(repo);
            expect(await administriertVonSchule.isSatisfiedBy(schule2)).toBeTruthy();
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

    describe('schule-zu-traeger', () => {
        it('should be satisfied when typ is SCHULE and administriertVon is TRAEGER ', async () => {
            const schuleZuTraeger: SchuleZuTraeger = new SchuleZuTraeger(repo);
            expect(await schuleZuTraeger.isSatisfiedBy(schule1)).toBeTruthy();
        });
        it('should not be satisfied when typ is SCHULE and administriertVon is SCHULE', async () => {
            const schuleZuTraeger: SchuleZuTraeger = new SchuleZuTraeger(repo);
            expect(await schuleZuTraeger.isSatisfiedBy(schule2)).toBeFalsy();
        });
    });

    describe('traeger-zu-traeger', () => {
        it('should be satisfied', async () => {
            const traegerZuTraeger: TraegerZuTraeger = new TraegerZuTraeger(repo);
            expect(await traegerZuTraeger.isSatisfiedBy(traeger2)).toBeTruthy();
        });
        it('should not be satisfied', async () => {
            const traegerZuTraeger: TraegerZuTraeger = new TraegerZuTraeger(repo);
            expect(await traegerZuTraeger.isSatisfiedBy(traeger1)).toBeFalsy();
        });
    });

    describe('AdministriertVon circle reference test', () => {
        it('should be satisfied, circular reference in two non-root organisations', async () => {
            traeger2.administriertVon = traeger3.id;
            const administriertZyklus: AdministriertZyklus = new AdministriertZyklus(repo, traeger1.id);
            expect(await administriertZyklus.isSatisfiedBy(traeger2)).toBeTruthy();
        });

        it('should be satisfied, circular reference between non-root and root organisation', async () => {
            traeger1.administriertVon = traeger3.id;
            const administriertZyklus: AdministriertZyklus = new AdministriertZyklus(repo, traeger1.id);
            expect(await administriertZyklus.isSatisfiedBy(traeger1)).toBeTruthy();
        });

        it('should not be satisfied, when circular reference is in the root organisation', async () => {
            traeger1.administriertVon = traeger1.id;
            await repo.save(traeger1);
            const administriertZyklus: AdministriertZyklus = new AdministriertZyklus(repo, traeger1.id);
            expect(await administriertZyklus.isSatisfiedBy(traeger3)).toBeFalsy();
        });

        it('should not be satisfied because chaining is not building a circular reference', async () => {
            const administriertZyklus: AdministriertZyklus = new AdministriertZyklus(repo, traeger1.id);
            expect(await administriertZyklus.isSatisfiedBy(traeger3)).toBeFalsy();
        });
    });
});
