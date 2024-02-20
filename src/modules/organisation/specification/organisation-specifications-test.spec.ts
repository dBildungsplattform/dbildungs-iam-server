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
import { OrganisationPersistenceMapperProfile } from '../persistence/organisation-persistence.mapper.profile.js';
import { ZyklusInAdministriertVon } from './zyklus-in-administriert-von.js';
import { SchuleAdministriertVonTraeger } from './schule-administriert-von-traeger.js';
import { TraegerAdministriertVonTraeger } from './traeger-administriert-von-traeger.js';
import { ZyklusInZugehoerigZu } from './zyklus-in-zugehoerig-zu.js';
import { SchuleZugehoerigZuTraeger } from './schule-zugehoerig-zu-traeger.js';
import { TraegerZugehoerigZuTraeger } from './traeger-zugehoerig-zu-traeger.js';
import { NurKlasseKursUnterSchule } from './nur-klasse-kurs-unter-schule.js';

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
    }, 100000);

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);

        let traeger: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
            id: 'a10852ab-1d75-45a7-9421-b1cbd8abe693',
            name: 'Traeger1',
            typ: OrganisationsTyp.TRAEGER,
            administriertVon: undefined,
            zugehoerigZu: undefined,
        });
        traeger1 = await repo.save(traeger);
        traeger = DoFactory.createOrganisation(false, {
            id: '2',
            name: 'Traeger2',
            typ: OrganisationsTyp.TRAEGER,
            administriertVon: traeger1.id,
            zugehoerigZu: traeger1.id,
        });
        traeger2 = await repo.save(traeger);
        traeger = DoFactory.createOrganisation(false, {
            id: '3',
            name: 'Traeger3',
            typ: OrganisationsTyp.TRAEGER,
            administriertVon: traeger2.id,
            zugehoerigZu: traeger2.id,
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

    describe('schule-administriert-von-traeger', () => {
        it('should be satisfied when typ is SCHULE and administriertVon is TRAEGER ', async () => {
            const schuleAdministriertVonTraeger: SchuleAdministriertVonTraeger = new SchuleAdministriertVonTraeger(
                repo,
            );
            expect(await schuleAdministriertVonTraeger.isSatisfiedBy(schule1)).toBeTruthy();
        });
        it('should not be satisfied when typ is SCHULE and administriertVon is SCHULE', async () => {
            const schuleAdministriertVonTraeger: SchuleAdministriertVonTraeger = new SchuleAdministriertVonTraeger(
                repo,
            );
            expect(await schuleAdministriertVonTraeger.isSatisfiedBy(schule2)).toBeFalsy();
        });
    });

    describe('schule-zugehoerig-zu-traeger', () => {
        it('should be satisfied when typ is SCHULE and zugehoerigZu is TRAEGER ', async () => {
            const schuleZugehoerigZuTraeger: SchuleZugehoerigZuTraeger = new SchuleZugehoerigZuTraeger(repo);
            expect(await schuleZugehoerigZuTraeger.isSatisfiedBy(schule1)).toBeTruthy();
        });
        it('should not be satisfied when typ is SCHULE and zugehoerigZu is SCHULE', async () => {
            const schuleZugehoerigZuTraeger: SchuleZugehoerigZuTraeger = new SchuleZugehoerigZuTraeger(repo);
            expect(await schuleZugehoerigZuTraeger.isSatisfiedBy(schule2)).toBeFalsy();
        });
    });

    describe('traeger-administriert-von-traeger', () => {
        it('should be satisfied when typ is TRAEGER and administriertVon is TRAEGER', async () => {
            const traegerZuTraeger: TraegerAdministriertVonTraeger = new TraegerAdministriertVonTraeger(repo);
            expect(await traegerZuTraeger.isSatisfiedBy(traeger2)).toBeTruthy();
        });
        it('should not be satisfied when typ is TRAEGER and administriertVon is undefined', async () => {
            const traegerZuTraeger: TraegerAdministriertVonTraeger = new TraegerAdministriertVonTraeger(repo);
            expect(await traegerZuTraeger.isSatisfiedBy(traeger1)).toBeFalsy();
        });
    });

    describe('traeger-zugehoerig-zu-traeger', () => {
        it('should be satisfied when typ is TRAEGER and zugehoerigZu is TRAEGER', async () => {
            const traegerZugehoerigZuTraeger: TraegerZugehoerigZuTraeger = new TraegerZugehoerigZuTraeger(repo);
            expect(await traegerZugehoerigZuTraeger.isSatisfiedBy(traeger2)).toBeTruthy();
        });
        it('should not be satisfied when typ is TRAEGER and zugehoerigZu is undefined', async () => {
            const traegerZugehoerigZuTraeger: TraegerZugehoerigZuTraeger = new TraegerZugehoerigZuTraeger(repo);
            expect(await traegerZugehoerigZuTraeger.isSatisfiedBy(traeger1)).toBeFalsy();
        });
    });

    describe('AdministriertVon circle reference test', () => {
        it('should be satisfied, circular reference in two non-root organisations', async () => {
            traeger2.administriertVon = traeger3.id;
            const administriertZyklus: ZyklusInAdministriertVon = new ZyklusInAdministriertVon(repo);
            expect(await administriertZyklus.isSatisfiedBy(traeger2)).toBeTruthy();
        });

        it('should not be satisfied because chaining is not building a circular reference', async () => {
            const administriertZyklus: ZyklusInAdministriertVon = new ZyklusInAdministriertVon(repo);
            expect(await administriertZyklus.isSatisfiedBy(traeger3)).toBeFalsy();
        });

        //this case shall not happen, because in running app altering the root-organisation should be forbidden
        it('should be satisfied, circular reference between non-root and root organisation', async () => {
            let traeger: OrganisationDo<boolean> = DoFactory.createOrganisation(true, {
                id: 'a10852ab-1d75-45a7-9421-b1cbd8abe693',
                name: 'Traeger1',
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: undefined,
            });
            const t1: OrganisationDo<true> = await repo.save(traeger);
            traeger = DoFactory.createOrganisation(false, {
                name: 'Traeger2',
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: t1.id,
            });
            const t2: OrganisationDo<true> = await repo.save(traeger);
            traeger = DoFactory.createOrganisation(false, {
                name: 'Traeger3',
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: t2.id,
            });
            const t3: OrganisationDo<true> = await repo.save(traeger);

            t1.administriertVon = t3.id;
            const administriertZyklus: ZyklusInAdministriertVon = new ZyklusInAdministriertVon(repo);
            expect(await administriertZyklus.isSatisfiedBy(t1)).toBeTruthy();
        });
    });

    describe('ZugehoerigZu circle reference test', () => {
        it('should be satisfied, circular reference in two non-root organisations', async () => {
            traeger2.zugehoerigZu = traeger3.id;
            const zyklusInZugehoerigZu: ZyklusInZugehoerigZu = new ZyklusInZugehoerigZu(repo);
            expect(await zyklusInZugehoerigZu.isSatisfiedBy(traeger2)).toBeTruthy();
        });

        it('should not be satisfied because chaining is not building a circular reference', async () => {
            const zyklusInZugehoerigZu: ZyklusInZugehoerigZu = new ZyklusInZugehoerigZu(repo);
            expect(await zyklusInZugehoerigZu.isSatisfiedBy(traeger3)).toBeFalsy();
        });

        //this case shall not happen, because in running app altering the root-organisation should be forbidden
        it('should be satisfied, circular reference between non-root and root organisation', async () => {
            let traeger: OrganisationDo<boolean> = DoFactory.createOrganisation(true, {
                id: 'a10852ab-1d75-45a7-9421-b1cbd8abe693',
                name: 'Traeger1',
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: undefined,
                zugehoerigZu: undefined,
            });
            const t1: OrganisationDo<true> = await repo.save(traeger);
            traeger = DoFactory.createOrganisation(false, {
                name: 'Traeger2',
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: t1.id,
                zugehoerigZu: t1.id,
            });
            const t2: OrganisationDo<true> = await repo.save(traeger);
            traeger = DoFactory.createOrganisation(false, {
                name: 'Traeger3',
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: t2.id,
                zugehoerigZu: t2.id,
            });
            const t3: OrganisationDo<true> = await repo.save(traeger);

            t1.zugehoerigZu = t3.id;
            const zyklusInZugehoerigZu: ZyklusInZugehoerigZu = new ZyklusInZugehoerigZu(repo);
            expect(await zyklusInZugehoerigZu.isSatisfiedBy(t1)).toBeTruthy();
        });
    });

    describe('nur-klasse-kurs-unter-schule', () => {
        it('should be satisfied when typ is undefined and parent has typ SCHULE', async () => {
            const klasseDo: OrganisationDo<false> = DoFactory.createOrganisation(false, {
                name: 'Klasse1',
                typ: undefined,
                administriertVon: schule1.id,
                zugehoerigZu: schule1.id,
            });
            const klasse: OrganisationDo<true> = await repo.save(klasseDo);
            const nurKlasseKursUnterSchule: NurKlasseKursUnterSchule = new NurKlasseKursUnterSchule(repo);
            expect(await nurKlasseKursUnterSchule.isSatisfiedBy(klasse)).toBeTruthy();
        });
        it('should not be satisfied when typ is TRAEGER and parent via administriertVon has typ SCHULE', async () => {
            const traegerDo: OrganisationDo<false> = DoFactory.createOrganisation(false, {
                name: 'EinTraeger',
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: schule1.id,
                zugehoerigZu: undefined,
            });
            const einTraeger: OrganisationDo<true> = await repo.save(traegerDo);
            const nurKlasseKursUnterSchule: NurKlasseKursUnterSchule = new NurKlasseKursUnterSchule(repo);
            expect(await nurKlasseKursUnterSchule.isSatisfiedBy(einTraeger)).toBeFalsy();
        });
        it('should not be satisfied when typ is TRAEGER and parent via zugehoerigZu has typ SCHULE', async () => {
            const traegerDo: OrganisationDo<false> = DoFactory.createOrganisation(false, {
                name: 'EinTraeger',
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: undefined,
                zugehoerigZu: schule1.id,
            });
            const einTraeger: OrganisationDo<true> = await repo.save(traegerDo);
            const nurKlasseKursUnterSchule: NurKlasseKursUnterSchule = new NurKlasseKursUnterSchule(repo);
            expect(await nurKlasseKursUnterSchule.isSatisfiedBy(einTraeger)).toBeFalsy();
        });
    });
});
