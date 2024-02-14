import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { AdministriertVonTraeger } from './administriert-von-traeger.js';
import { OrganisationPersistenceMapperProfile } from '../persistence/organisation-persistence.mapper.profile.js';
import { ZugehoerigZuSchule } from './zugehoerig-zu-schule.js';
import { ZugehoerigZuTraeger } from './zugehoerig-zu-traeger.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OrganisationDo } from '../domain/organisation.do.js';
import { AdministriertVonSchule } from './administriert-von-schule.js';
import { SchuleZuTraeger } from './schule-zu-traeger.js';
import { TraegerZuTraeger } from './traeger-zu-traeger.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

describe('OrganisationSpecificationMockedRepoTests', () => {
    let module: TestingModule;
    let repoMock: DeepMocked<OrganisationRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: false }), MapperTestModule],
            providers: [
                OrganisationPersistenceMapperProfile,
                {
                    provide: OrganisationRepo,
                    useValue: createMock<OrganisationRepo>(),
                },
            ],
        }).compile();
        repoMock = module.get(OrganisationRepo);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('administriert-von-traeger', () => {
        it('should not be satisfied when organisation referenced by administriertVon cannot be found', async () => {
            const administriertVonTraeger: AdministriertVonTraeger = new AdministriertVonTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, { administriertVon: '1' });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await administriertVonTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
        it('should not be satisfied when administriertVon is undefined', async () => {
            const administriertVonTraeger: AdministriertVonTraeger = new AdministriertVonTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, { administriertVon: undefined });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await administriertVonTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
    });

    describe('administriert-von-schule', () => {
        it('should not be satisfied when organisation referenced by administriertVon cannot be found', async () => {
            const administriertVonSchule: AdministriertVonSchule = new AdministriertVonSchule(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, { administriertVon: '1' });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await administriertVonSchule.isSatisfiedBy(schule)).toBeFalsy();
        });
        it('should not be satisfied when administriertVon is undefined', async () => {
            const administriertVonSchule: AdministriertVonSchule = new AdministriertVonSchule(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, { administriertVon: undefined });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await administriertVonSchule.isSatisfiedBy(schule)).toBeFalsy();
        });
    });

    describe('ist-zugehoerig-zu-schule', () => {
        it('should not be satisfied when organisation referenced by zugehoerigZu cannot be found', async () => {
            const zugehoerigZuSchule: ZugehoerigZuSchule = new ZugehoerigZuSchule(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, { zugehoerigZu: '1' });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await zugehoerigZuSchule.isSatisfiedBy(schule)).toBeFalsy();
        });
        it('should not be satisfied when zugehoerigZu is undefined', async () => {
            const zugehoerigZuSchule: ZugehoerigZuSchule = new ZugehoerigZuSchule(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, { zugehoerigZu: undefined });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await zugehoerigZuSchule.isSatisfiedBy(schule)).toBeFalsy();
        });
    });

    describe('ist-zugehoerig-zu-traeger', () => {
        it('should not be satisfied when organisation referenced by zugehoerigZu cannot be found', async () => {
            const zugehoerigZuTraeger: ZugehoerigZuTraeger = new ZugehoerigZuTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, { zugehoerigZu: '1' });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await zugehoerigZuTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
        it('should not be satisfied when zugehoerigZu is undefined', async () => {
            const zugehoerigZuTraeger: ZugehoerigZuTraeger = new ZugehoerigZuTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, { zugehoerigZu: undefined });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await zugehoerigZuTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
    });

    describe('schule-zu-traeger', () => {
        it('should be satisfied when organisation is not SCHULE', async () => {
            const schuleZuTraeger: SchuleZuTraeger = new SchuleZuTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SONSTIGE,
                administriertVon: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await schuleZuTraeger.isSatisfiedBy(schule)).toBeTruthy();
        });

        it('should not be satisfied when organisation referenced by administriertVon cannot be found', async () => {
            const schuleZuTraeger: SchuleZuTraeger = new SchuleZuTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                administriertVon: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await schuleZuTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
        it('should not be satisfied when administriertVon is undefined', async () => {
            const schuleZuTraeger: SchuleZuTraeger = new SchuleZuTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                administriertVon: undefined,
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await schuleZuTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
    });

    describe('traeger-zu-traeger', () => {
        it('should be satisfied when organisation is not TRAEGER', async () => {
            const traegerZuTraeger: TraegerZuTraeger = new TraegerZuTraeger(repoMock);
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SONSTIGE,
                administriertVon: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await traegerZuTraeger.isSatisfiedBy(traeger)).toBeTruthy();
        });
        it('should not be satisfied when organisation referenced by administriertVon cannot be found', async () => {
            const traegerZuTraeger: TraegerZuTraeger = new TraegerZuTraeger(repoMock);
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await traegerZuTraeger.isSatisfiedBy(traeger)).toBeFalsy();
        });
        it('should not be satisfied when administriertVon is undefined', async () => {
            const traegerZuTraeger: TraegerZuTraeger = new TraegerZuTraeger(repoMock);
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: undefined,
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await traegerZuTraeger.isSatisfiedBy(traeger)).toBeFalsy();
        });
    });
});
