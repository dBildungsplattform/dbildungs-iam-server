import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationService } from './organisation.service.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { OrganisationDo } from './organisation.do.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { DatabaseTestModule } from '../../../../test/utils/database-test.module.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { OrganisationsTyp } from './organisation.enums.js';
import { SchuleZuTraegerError } from '../specification/error/schule-zu-traeger.error.js';
import { MikroORM } from '@mikro-orm/core';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationPersistenceMapperProfile } from '../persistence/organisation-persistence.mapper.profile.js';
import { TraegerZuTraegerError } from '../specification/error/traeger-zu-traeger.error.js';
import { AdministriertZyklusError } from '../specification/error/administriert-zyklus.error.js';
import { RootOrganisationImmutableError } from '../specification/error/root-organisation-immutable.error.js';

describe('OrganisationServiceSpecificationTest', () => {
    let module: TestingModule;
    let organisationService: OrganisationService;
    let organisationRepo: OrganisationRepo;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [OrganisationService, OrganisationRepo, OrganisationPersistenceMapperProfile],
        }).compile();
        organisationService = module.get(OrganisationService);
        organisationRepo = module.get(OrganisationRepo);
        orm = module.get(MikroORM);

        await DatabaseTestModule.setupDatabase(orm);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {
        jest.resetAllMocks();
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(organisationService).toBeDefined();
    });

    describe('setAdministriertVon', () => {
        it('should update the organisation', async () => {
            const rootDo: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Root',
                administriertVon: undefined,
                typ: OrganisationsTyp.TRAEGER,
            });
            const root: OrganisationDo<true> = await organisationRepo.save(rootDo);
            const traeger1Do: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Träger1',
                administriertVon: root.id,
                typ: OrganisationsTyp.TRAEGER,
            });
            const traeger1: OrganisationDo<true> = await organisationRepo.save(traeger1Do);
            const traeger2Do: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Träger2',
                administriertVon: root.id,
                typ: OrganisationsTyp.TRAEGER,
            });
            const traeger2: OrganisationDo<true> = await organisationRepo.save(traeger2Do);
            const schuleDo: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Schule',
                administriertVon: traeger1.id,
                typ: OrganisationsTyp.SCHULE,
            });
            schuleDo.administriertVon = root.id;
            const schule: OrganisationDo<true> = await organisationRepo.save(schuleDo);

            const result: Result<void> = await organisationService.setAdministriertVon(traeger2.id, schule.id);

            expect(result).toEqual<Result<void>>({
                ok: true,
                value: undefined,
            });
        });

        it('should return a domain error if adminstriertVon property of root organisation should be altered', async () => {
            const rootDo: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Root',
                administriertVon: undefined,
                typ: OrganisationsTyp.TRAEGER,
            });
            const schuleDo: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Schule',
                administriertVon: undefined,
                typ: OrganisationsTyp.SCHULE,
            });
            const root: OrganisationDo<true> = await organisationRepo.save(rootDo);
            schuleDo.administriertVon = root.id;
            const schule: OrganisationDo<true> = await organisationRepo.save(schuleDo);

            const result: Result<void> = await organisationService.setAdministriertVon(schule.id, root.id);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new RootOrganisationImmutableError({}),
            });
        });

        it('should return a domain error if the SchuleZuTraeger specification is not met', async () => {
            const rootDo: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Root',
                administriertVon: undefined,
                typ: OrganisationsTyp.TRAEGER,
            });
            const root: OrganisationDo<true> = await organisationRepo.save(rootDo);
            const schule1Do: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Schule',
                administriertVon: root.id,
                typ: OrganisationsTyp.SCHULE,
            });
            const schule2Do: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Schule',
                administriertVon: root.id,
                typ: OrganisationsTyp.SCHULE,
            });
            const schule1: OrganisationDo<true> = await organisationRepo.save(schule1Do);
            const schule2: OrganisationDo<true> = await organisationRepo.save(schule2Do);

            const result: Result<void> = await organisationService.setAdministriertVon(schule1.id, schule2.id);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new SchuleZuTraegerError(schule2.id, 'SchuleZuTraeger'),
            });
        });

        it('should return a domain error if the TraegerZuTraeger specification is not met', async () => {
            const rootDo: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Root',
                administriertVon: undefined,
                typ: OrganisationsTyp.TRAEGER,
            });
            const root: OrganisationDo<true> = await organisationRepo.save(rootDo);
            const schuleDo: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Schule',
                administriertVon: root.id,
                typ: OrganisationsTyp.SCHULE,
            });
            const traegerDo: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Traeger',
                administriertVon: root.id,
                typ: OrganisationsTyp.TRAEGER,
            });
            const schule: OrganisationDo<true> = await organisationRepo.save(schuleDo);
            const traeger: OrganisationDo<true> = await organisationRepo.save(traegerDo);

            const result: Result<void> = await organisationService.setAdministriertVon(schule.id, traeger.id);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new TraegerZuTraegerError(traeger.id, 'TraegerZuTraeger'),
            });
        });

        it('should return a domain error if the AdministriertZyklus specification is not met', async () => {
            const rootDo: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Root',
                administriertVon: undefined,
                typ: OrganisationsTyp.TRAEGER,
            });
            const root: OrganisationDo<true> = await organisationRepo.save(rootDo);
            const traeger1Do: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Traeger1',
                administriertVon: root.id,
                typ: OrganisationsTyp.TRAEGER,
            });
            const traeger1: OrganisationDo<true> = await organisationRepo.save(traeger1Do);
            const traeger2Do: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                name: 'Traeger2',
                administriertVon: traeger1.id,
                typ: OrganisationsTyp.TRAEGER,
            });
            const traeger2: OrganisationDo<true> = await organisationRepo.save(traeger2Do);

            const result: Result<void> = await organisationService.setAdministriertVon(traeger2.id, traeger1.id);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new AdministriertZyklusError(traeger1.id, 'ZyklusInAdministriertVon'),
            });
        });
    });
});
