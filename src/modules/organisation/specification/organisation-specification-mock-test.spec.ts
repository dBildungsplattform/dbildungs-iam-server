import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { OrganisationPersistenceMapperProfile } from '../persistence/organisation-persistence.mapper.profile.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OrganisationDo } from '../domain/organisation.do.js';
import { SchuleAdministriertVonTraeger } from './schule-administriert-von-traeger.js';
import { TraegerAdministriertVonTraeger } from './traeger-administriert-von-traeger.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { TraegerZugehoerigZuTraeger } from './traeger-zugehoerig-zu-traeger.js';
import { SchuleZugehoerigZuTraeger } from './schule-zugehoerig-zu-traeger.js';
import { NurKlasseKursUnterSchule } from './nur-klasse-kurs-unter-schule.js';

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
    }, 100000);

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('schule-administriert-von-traeger', () => {
        it('should be satisfied when organisation is not SCHULE', async () => {
            const schuleZuTraeger: SchuleAdministriertVonTraeger = new SchuleAdministriertVonTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SONSTIGE,
                administriertVon: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await schuleZuTraeger.isSatisfiedBy(schule)).toBeTruthy();
        });

        it('should not be satisfied when organisation referenced by administriertVon cannot be found', async () => {
            const schuleZuTraeger: SchuleAdministriertVonTraeger = new SchuleAdministriertVonTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                administriertVon: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await schuleZuTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
        it('should not be satisfied when administriertVon is undefined', async () => {
            const schuleZuTraeger: SchuleAdministriertVonTraeger = new SchuleAdministriertVonTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                administriertVon: undefined,
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await schuleZuTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
    });

    describe('schule-zugehoerig-zu-traeger', () => {
        it('should be satisfied when organisation is not SCHULE', async () => {
            const schuleZugehoerigZuTraeger: SchuleZugehoerigZuTraeger = new SchuleZugehoerigZuTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SONSTIGE,
                zugehoerigZu: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await schuleZugehoerigZuTraeger.isSatisfiedBy(schule)).toBeTruthy();
        });

        it('should not be satisfied when organisation referenced by zugehoerigZu cannot be found', async () => {
            const schuleZugehoerigZuTraeger: SchuleZugehoerigZuTraeger = new SchuleZugehoerigZuTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                zugehoerigZu: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await schuleZugehoerigZuTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
        it('should not be satisfied when zugehoerigZu is undefined', async () => {
            const schuleZugehoerigZuTraeger: SchuleZugehoerigZuTraeger = new SchuleZugehoerigZuTraeger(repoMock);
            const schule: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                zugehoerigZu: undefined,
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await schuleZugehoerigZuTraeger.isSatisfiedBy(schule)).toBeFalsy();
        });
    });

    describe('traeger-administriert-von-traeger', () => {
        it('should be satisfied when organisation is not TRAEGER', async () => {
            const traegerAdministriertVonTraeger: TraegerAdministriertVonTraeger = new TraegerAdministriertVonTraeger(
                repoMock,
            );
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SONSTIGE,
                administriertVon: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await traegerAdministriertVonTraeger.isSatisfiedBy(traeger)).toBeTruthy();
        });
        it('should not be satisfied when organisation referenced by administriertVon cannot be found', async () => {
            const traegerAdministriertVonTraeger: TraegerAdministriertVonTraeger = new TraegerAdministriertVonTraeger(
                repoMock,
            );
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await traegerAdministriertVonTraeger.isSatisfiedBy(traeger)).toBeFalsy();
        });
        it('should not be satisfied when administriertVon is undefined', async () => {
            const traegerAdministriertVonTraeger: TraegerAdministriertVonTraeger = new TraegerAdministriertVonTraeger(
                repoMock,
            );
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: undefined,
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await traegerAdministriertVonTraeger.isSatisfiedBy(traeger)).toBeFalsy();
        });
    });

    describe('traeger-zugehoerig-zu-traeger', () => {
        it('should be satisfied when organisation is not TRAEGER', async () => {
            const traegerZugehoerigZuTraeger: TraegerZugehoerigZuTraeger = new TraegerZugehoerigZuTraeger(repoMock);
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SONSTIGE,
                zugehoerigZu: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await traegerZugehoerigZuTraeger.isSatisfiedBy(traeger)).toBeTruthy();
        });
        it('should not be satisfied when organisation referenced by zugehoerigZu cannot be found', async () => {
            const traegerZugehoerigZuTraeger: TraegerZugehoerigZuTraeger = new TraegerZugehoerigZuTraeger(repoMock);
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                zugehoerigZu: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await traegerZugehoerigZuTraeger.isSatisfiedBy(traeger)).toBeFalsy();
        });
        it('should not be satisfied when zugehoerigZu is undefined', async () => {
            const traegerZugehoerigZuTraeger: TraegerZugehoerigZuTraeger = new TraegerZugehoerigZuTraeger(repoMock);
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                zugehoerigZu: undefined,
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await traegerZugehoerigZuTraeger.isSatisfiedBy(traeger)).toBeFalsy();
        });
    });

    describe('nur-klasse-kurs-unter-schule', () => {
        it('should be satisfied when organisation referenced by administriertVon cannot be found', async () => {
            const nurKlasseKursUnterSchule: NurKlasseKursUnterSchule = new NurKlasseKursUnterSchule(repoMock);
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                administriertVon: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await nurKlasseKursUnterSchule.isSatisfiedBy(traeger)).toBeTruthy();
        });
        it('should be satisfied when organisation referenced by zugehoerigZu cannot be found', async () => {
            const nurKlasseKursUnterSchule: NurKlasseKursUnterSchule = new NurKlasseKursUnterSchule(repoMock);
            const traeger: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                zugehoerigZu: '1',
            });
            repoMock.findById.mockResolvedValueOnce(null);
            expect(await nurKlasseKursUnterSchule.isSatisfiedBy(traeger)).toBeTruthy();
        });
    });
});
