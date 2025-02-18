import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Dictionary } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { EntityCouldNotBeUpdated, MissingPermissionsError } from '../../../shared/error/index.js';
import { Paged } from '../../../shared/paging/index.js';
import { OrganisationService } from './organisation.service.js';
import { OrganisationsTyp, RootDirectChildrenType } from './organisation.enums.js';
import { KennungRequiredForSchuleError } from '../specification/error/kennung-required-for-schule.error.js';
import { NameRequiredForSchuleError } from '../specification/error/name-required-for-schule.error.js';
import { SchuleKennungEindeutigError } from '../specification/error/schule-kennung-eindeutig.error.js';
import { OrganisationRepository } from '../persistence/organisation.repository.js';
import { Organisation } from './organisation.js';
import { NameForOrganisationWithTrailingSpaceError } from '../specification/error/name-with-trailing-space.error.js';
import { KennungForOrganisationWithTrailingSpaceError } from '../specification/error/kennung-with-trailing-space.error.js';
import { EmailAdressOnOrganisationTypError } from '../specification/error/email-adress-on-organisation-typ-error.js';
import { KlasseWithoutNumberOrLetterError } from '../specification/error/klasse-without-number-or-letter.error.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { PersonenkontextRolleFields, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { KlasseNurVonSchuleAdministriertError } from '../specification/error/klasse-nur-von-schule-administriert.error.js';
import { PersonPermissionsMock } from '../../../../test/utils/person-permissions.mock.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { OrganisationZuordnungVerschiebenError } from './organisation-zuordnung-verschieben.error.js';
import { OrganisationsOnDifferentSubtreesError } from '../specification/error/organisations-on-different-subtrees.error.js';
import { SchuleUnterTraegerError } from '../specification/error/schule-unter-traeger.error.js';

describe('OrganisationService', () => {
    let module: TestingModule;
    let organisationService: OrganisationService;
    let organisationRepositoryMock: DeepMocked<OrganisationRepository>;
    let mapperMock: DeepMocked<Mapper>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, LoggingTestModule],
            providers: [
                OrganisationService,
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
            ],
        }).compile();
        organisationService = module.get(OrganisationService);
        organisationRepositoryMock = module.get(OrganisationRepository);
        mapperMock = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(organisationService).toBeDefined();
    });

    describe('createOrganisation', () => {
        const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
        const organisationUser: Organisation<true> = DoFactory.createOrganisation(true);
        const personenkontextewithRolesMock: PersonenkontextRolleFields[] = [
            {
                organisationsId: organisationUser.id,
                rolle: { systemrechte: [], serviceProviderIds: [] },
            },
        ];
        it('should create an organisation', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            organisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);
            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisation,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: organisation as unknown as Organisation<true>,
            });
        });

        it('should create a Schule and log its creation', async () => {
            permissionsMock.getPersonenkontextewithRoles.mockResolvedValue(personenkontextewithRolesMock);
            organisationRepositoryMock.findById.mockResolvedValueOnce(organisationUser);
            const schule: Organisation<false> = DoFactory.createOrganisation(false);
            schule.typ = OrganisationsTyp.SCHULE;
            organisationRepositoryMock.findBy.mockResolvedValueOnce([[], 0]);
            organisationRepositoryMock.save.mockResolvedValue(schule as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(schule as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                schule,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: schule as unknown as Organisation<true>,
            });
        });

        it('should create a Klasse and log its creation', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true);
            const klasse: Organisation<false> = DoFactory.createOrganisation(false);
            schule.typ = OrganisationsTyp.SCHULE;
            klasse.typ = OrganisationsTyp.KLASSE;
            klasse.administriertVon = schule.id;
            klasse.zugehoerigZu = schule.id;
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            organisationRepositoryMock.save.mockResolvedValue(klasse as unknown as Organisation<true>);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            mapperMock.map.mockReturnValue(klasse as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                klasse,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: klasse as unknown as Organisation<true>,
            });
        });

        it('should fail to create a Klasse and log the creation attempt', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            const klasse: Organisation<false> = DoFactory.createOrganisation(false);
            klasse.typ = OrganisationsTyp.KLASSE;
            klasse.zugehoerigZu = schule.id;
            klasse.administriertVon = schule.id;
            organisationRepositoryMock.exists.mockResolvedValue(true);
            organisationRepositoryMock.exists.mockResolvedValue(true);
            organisationRepositoryMock.save.mockResolvedValue(klasse as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(klasse as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                klasse,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KlasseNurVonSchuleAdministriertError(),
            });
        });

        it('should return a domain error if first parent organisation does not exist', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            organisation.administriertVon = faker.string.uuid();
            organisationRepositoryMock.exists.mockResolvedValueOnce(false);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', organisation.administriertVon),
            });
        });

        it('should return a domain error if second parent organisation does not exist', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            organisation.zugehoerigZu = faker.string.uuid();
            organisationRepositoryMock.exists.mockResolvedValueOnce(false);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', organisation.zugehoerigZu),
            });
        });

        it('should return a domain error if kennung is not set and type is schule', async () => {
            permissionsMock.getPersonenkontextewithRoles.mockResolvedValue(personenkontextewithRolesMock);
            organisationRepositoryMock.findById.mockResolvedValue(organisationUser);

            const organisation: Organisation<false> = DoFactory.createOrganisation(false, {
                typ: OrganisationsTyp.SCHULE,
                kennung: undefined,
            });
            organisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KennungRequiredForSchuleError(),
            });
        });

        it('should return a domain error if name is not set and type is schule', async () => {
            permissionsMock.getPersonenkontextewithRoles.mockResolvedValue(personenkontextewithRolesMock);
            organisationRepositoryMock.findById.mockResolvedValue(organisationUser);

            const organisation: Organisation<false> = DoFactory.createOrganisation(false, {
                typ: OrganisationsTyp.SCHULE,
                kennung: '1234567',
                name: undefined,
            });
            organisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new NameRequiredForSchuleError(),
            });
        });

        it('should return a domain error if type is klasse and email is set', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false, {
                typ: OrganisationsTyp.KLASSE,
                emailAdress: 'klassenmail123@spsh.de',
                name: 'Klasse123',
            });
            organisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EmailAdressOnOrganisationTypError(),
            });
        });

        it('should return a domain error if kennung is not unique and type is schule', async () => {
            permissionsMock.getPersonenkontextewithRoles.mockResolvedValue(personenkontextewithRolesMock);
            organisationRepositoryMock.findById.mockResolvedValue(organisationUser);

            const name: string = faker.string.alpha();
            const kennung: string = faker.string.numeric({ length: 7 });
            const organisation: Organisation<false> = DoFactory.createOrganisation(false, {
                typ: OrganisationsTyp.SCHULE,
                kennung: kennung,
                name: name,
            });
            const counted: Counted<Organisation<true>> = [
                [
                    DoFactory.createOrganisation(true, {
                        typ: OrganisationsTyp.SCHULE,
                        kennung: kennung,
                        name: name,
                    }),
                ],
                1,
            ];
            organisationRepositoryMock.findBy.mockResolvedValueOnce(counted);
            organisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new SchuleKennungEindeutigError(),
            });
        });

        it('should return a domain error', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            organisation.id = faker.string.uuid();
            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisation,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityCouldNotBeCreated(`Organization could not be created`),
            });
        });

        it('should return domain error if name contains trailing space', async () => {
            const organisationDo: Organisation<false> = DoFactory.createOrganisation(false, { name: ' name' });
            organisationRepositoryMock.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisationDo,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new NameForOrganisationWithTrailingSpaceError(),
            });
        });

        it('should return domain error if kennung contains trailing space', async () => {
            const organisationDo: Organisation<false> = DoFactory.createOrganisation(false, { kennung: ' ' });
            organisationRepositoryMock.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisationDo,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KennungForOrganisationWithTrailingSpaceError(),
            });
        });

        it('should return domain error if name contains trailing space', async () => {
            const organisationDo: Organisation<false> = DoFactory.createOrganisation(false, { name: ' name' });
            organisationRepositoryMock.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisationDo,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new NameForOrganisationWithTrailingSpaceError(),
            });
        });

        it('should return domain error if kennung contains trailing space', async () => {
            const organisationDo: Organisation<false> = DoFactory.createOrganisation(false, { kennung: ' ' });
            organisationRepositoryMock.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisationDo,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KennungForOrganisationWithTrailingSpaceError(),
            });
        });

        it('should return domain error if name contains no letter nor number', async () => {
            const organisationDo: Organisation<false> = DoFactory.createOrganisation(false, {
                name: '-',
                typ: OrganisationsTyp.KLASSE,
            });
            organisationRepositoryMock.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
            const result: Result<Organisation<true>> = await organisationService.createOrganisation(
                organisationDo,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KlasseWithoutNumberOrLetterError(),
            });
        });
    });

    describe('updateOrganisation', () => {
        const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
        const organisationUser: Organisation<true> = DoFactory.createOrganisation(true);
        const personenkontextewithRolesMock: PersonenkontextRolleFields[] = [
            {
                organisationsId: organisationUser.id,
                rolle: { systemrechte: [], serviceProviderIds: [] },
            },
        ];
        it('should update an organisation', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            organisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            organisationRepositoryMock.findById.mockResolvedValue(organisation);
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisation,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: organisation as unknown as Organisation<true>,
            });
        });

        it('should update a Schule and log the update', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true);
            schule.typ = OrganisationsTyp.SCHULE;
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            organisationRepositoryMock.findBy.mockResolvedValueOnce([[], 0]);
            organisationRepositoryMock.save.mockResolvedValue(schule as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(schule as unknown as Dictionary<unknown>);
            permissionsMock.getPersonenkontextewithRoles.mockResolvedValue(personenkontextewithRolesMock);
            organisationRepositoryMock.findById.mockResolvedValue(organisationUser);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                schule,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: schule as unknown as Organisation<true>,
            });
        });

        it('should update a Klasse and log the update', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true);
            const klasse: Organisation<true> = DoFactory.createOrganisation(true);
            schule.typ = OrganisationsTyp.SCHULE;
            klasse.typ = OrganisationsTyp.KLASSE;
            klasse.administriertVon = schule.id;
            klasse.zugehoerigZu = schule.id;
            organisationRepositoryMock.findById.mockResolvedValueOnce(klasse);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            organisationRepositoryMock.findChildOrgasForIds.mockResolvedValueOnce([]);
            organisationRepositoryMock.save.mockResolvedValue(klasse as unknown as Organisation<true>);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            mapperMock.map.mockReturnValue(klasse as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                klasse,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: klasse as unknown as Organisation<true>,
            });
        });

        it('should fail to update a Klasse and log the update attempt', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true);
            const klasse: Organisation<true> = DoFactory.createOrganisation(true);
            klasse.typ = OrganisationsTyp.KLASSE;
            klasse.zugehoerigZu = schule.id;
            organisationRepositoryMock.findById.mockResolvedValueOnce(klasse);
            organisationRepositoryMock.save.mockResolvedValue(klasse as unknown as Organisation<true>);
            organisationRepositoryMock.findById.mockResolvedValueOnce(schule);
            mapperMock.map.mockReturnValue(klasse as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                klasse,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KlasseNurVonSchuleAdministriertError(klasse.id),
            });
        });

        it('should return a domain error', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            organisation.id = '';
            organisationRepositoryMock.findById.mockResolvedValue({} as Option<Organisation<true>>);
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisation,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityCouldNotBeUpdated(`Organization could not be updated`, organisation.id),
            });
        });

        it('should return a domain error if kennung is not set and type is schule', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                kennung: undefined,
            });
            organisationRepositoryMock.findById.mockResolvedValueOnce(organisation as unknown as Organisation<true>);
            permissionsMock.getPersonenkontextewithRoles.mockResolvedValue(personenkontextewithRolesMock);
            organisationRepositoryMock.findById.mockResolvedValueOnce(organisationUser);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KennungRequiredForSchuleError(),
            });
        });

        it('should return a domain error if name is not set and type is schule', async () => {
            permissionsMock.getPersonenkontextewithRoles.mockResolvedValue(personenkontextewithRolesMock);
            organisationRepositoryMock.findById.mockResolvedValue(organisationUser);

            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                kennung: '1234567',
                name: undefined,
            });
            organisationRepositoryMock.findById.mockResolvedValue(organisation as unknown as Organisation<true>);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new NameRequiredForSchuleError(),
            });
        });

        it('should return a domain error if type is klasse and email is set', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
                emailAdress: 'klassenmail123@spsh.de',
                name: 'Klasse123',
            });
            organisationRepositoryMock.findById.mockResolvedValue(organisation as unknown as Organisation<true>);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EmailAdressOnOrganisationTypError(),
            });
        });

        it('should return a domain error if kennung is not unique and type is schule', async () => {
            permissionsMock.getPersonenkontextewithRoles.mockResolvedValue(personenkontextewithRolesMock);
            organisationRepositoryMock.findById.mockResolvedValue(organisationUser);

            const name: string = faker.string.alpha();
            const kennung: string = faker.string.numeric({ length: 7 });
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                kennung: kennung,
                name: name,
            });
            const counted: Counted<Organisation<true>> = [[organisation], 1];
            organisationRepositoryMock.findById.mockResolvedValue(organisation as unknown as Organisation<true>);
            organisationRepositoryMock.findBy.mockResolvedValueOnce(counted);
            organisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisation,
                permissionsMock,
            );

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new SchuleKennungEindeutigError(),
            });
        });

        it('should return a domain error when organisation cannot be found on update', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            organisationRepositoryMock.findById.mockResolvedValue(undefined);
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisation,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', organisation.id),
            });
        });

        it('should return domain error if name contains trailing space', async () => {
            const organisationDo: Organisation<true> = DoFactory.createOrganisation(true, { name: '  ' });
            organisationRepositoryMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisationDo,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new NameForOrganisationWithTrailingSpaceError(),
            });
        });

        it('should return domain error if kennung contains trailing space', async () => {
            const organisationDo: Organisation<true> = DoFactory.createOrganisation(true, { kennung: 'kennung ' });
            organisationRepositoryMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisationDo,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KennungForOrganisationWithTrailingSpaceError(),
            });
        });

        it('should return domain error if name contains trailing space', async () => {
            const organisationDo: Organisation<true> = DoFactory.createOrganisation(true, { name: '  ' });
            organisationRepositoryMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisationDo,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new NameForOrganisationWithTrailingSpaceError(),
            });
        });

        it('should return domain error if kennung contains trailing space', async () => {
            const organisationDo: Organisation<true> = DoFactory.createOrganisation(true, { kennung: 'kennung ' });
            organisationRepositoryMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(
                organisationDo,
                permissionsMock,
            );
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KennungForOrganisationWithTrailingSpaceError(),
            });
        });
    });

    describe('findOrganisationById', () => {
        it('should find an organization by its ID', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            organisationRepositoryMock.findById.mockResolvedValue(organisation);
            const result: Result<Organisation<true>> = await organisationService.findOrganisationById(organisation.id);
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: organisation,
            });
        });

        it('should return a domain error', async () => {
            organisationRepositoryMock.findById.mockResolvedValue(null);
            const organisationId: string = faker.string.uuid();
            const result: Result<Organisation<true>> = await organisationService.findOrganisationById(organisationId);
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityNotFoundError('Organization', organisationId),
            });
        });
    });

    describe('findAllOrganizations', () => {
        describe('when organizations are found', () => {
            it('should return all organizations', async () => {
                const organisation: Organisation<true> = DoFactory.createOrganisation(true);
                const organisations: Organisation<true>[] = [organisation];
                const total: number = organisations.length;

                organisationRepositoryMock.findBy.mockResolvedValue([organisations, total]);

                const result: Paged<Organisation<true>> = await organisationService.findAllOrganizations(organisation);

                expect(result).toEqual({
                    total: total,
                    offset: 0,
                    limit: total,
                    items: organisations,
                    pageTotal: total,
                });
            });
        });

        describe('when no organizations are found', () => {
            it('should return an empty list of organizations', async () => {
                const organisation: Organisation<false> = DoFactory.createOrganisation(false);

                organisationRepositoryMock.findBy.mockResolvedValue([[], 0]);

                const result: Paged<Organisation<true>> = await organisationService.findAllOrganizations(organisation);

                expect(result.items).toHaveLength(0);
                expect(result.items).toBeInstanceOf(Array);
            });
        });
    });

    describe('setZugehoerigZu', () => {
        it('should return a domain error if the child organisation does not exist', async () => {
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            const permissions: IPersonPermissions = new PersonPermissionsMock();
            organisationRepositoryMock.findByIds.mockResolvedValueOnce(new Map());

            const result: Result<void> = await organisationService.setZugehoerigZu(parentId, childId, permissions);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', childId),
            });
        });

        it('should return a domain error if the child organisation does not have a parent', async () => {
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            const permissions: IPersonPermissions = new PersonPermissionsMock();
            organisationRepositoryMock.findByIds.mockResolvedValueOnce(
                new Map([[childId, DoFactory.createOrganisation(true, { id: childId, zugehoerigZu: undefined })]]),
            );

            const result: Result<void> = await organisationService.setZugehoerigZu(parentId, childId, permissions);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', childId),
            });
        });

        it('should return a domain error if the parent organisation does not exist', async () => {
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            const permissions: IPersonPermissions = new PersonPermissionsMock();
            organisationRepositoryMock.findByIds.mockResolvedValueOnce(
                new Map([
                    [childId, DoFactory.createOrganisation(true, { id: childId, zugehoerigZu: faker.string.uuid() })],
                ]),
            );

            const result: Result<void> = await organisationService.setZugehoerigZu(parentId, childId, permissions);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', parentId),
            });
        });

        it("should return a domain error if the user doesn't have permissions for both parents", async () => {
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            const permissions: DeepMocked<IPersonPermissions> = createMock<IPersonPermissions>();
            organisationRepositoryMock.findByIds.mockResolvedValueOnce(
                new Map([
                    [childId, DoFactory.createOrganisation(true, { id: childId, zugehoerigZu: faker.string.uuid() })],
                    [parentId, DoFactory.createOrganisation(true, { id: parentId })],
                ]),
            );
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

            const result: Result<void> = await organisationService.setZugehoerigZu(parentId, childId, permissions);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new MissingPermissionsError('Not allowed to edit organisations'),
            });
        });

        it('should return a domain error if the child organisation is not a school', async () => {
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            const permissions: IPersonPermissions = new PersonPermissionsMock();
            organisationRepositoryMock.findByIds.mockResolvedValueOnce(
                new Map([
                    [
                        childId,
                        DoFactory.createOrganisation(true, {
                            id: childId,
                            typ: OrganisationsTyp.TRAEGER,
                            zugehoerigZu: faker.string.uuid(),
                        }),
                    ],
                    [parentId, DoFactory.createOrganisation(true, { id: parentId })],
                ]),
            );

            const result: Result<void> = await organisationService.setZugehoerigZu(parentId, childId, permissions);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new OrganisationZuordnungVerschiebenError(childId, OrganisationsTyp.TRAEGER),
            });
        });

        it('should return a domain error if the child organisation would change subtrees', async () => {
            const school: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                zugehoerigZu: faker.string.uuid(),
            });
            const traeger: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                zugehoerigZu: faker.string.uuid(),
            });

            const permissions: IPersonPermissions = new PersonPermissionsMock();
            organisationRepositoryMock.findByIds.mockResolvedValueOnce(
                new Map([
                    [school.id, school],
                    [traeger.id, traeger],
                ]),
            );

            organisationRepositoryMock.findOrganisationZuordnungErsatzOderOeffentlich.mockResolvedValueOnce(
                RootDirectChildrenType.ERSATZ,
            ); // OrganisationOnSameSubtree
            organisationRepositoryMock.findOrganisationZuordnungErsatzOderOeffentlich.mockResolvedValueOnce(
                RootDirectChildrenType.OEFFENTLICH,
            ); // OrganisationOnSameSubtree

            const result: Result<void> = await organisationService.setZugehoerigZu(traeger.id, school.id, permissions);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new OrganisationsOnDifferentSubtreesError(),
            });
        });

        it('should return a domain error if the child organisation could not be updated', async () => {
            const school: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                administriertVon: faker.string.uuid(),
                zugehoerigZu: faker.string.uuid(),
            });
            const traeger: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.TRAEGER,
                zugehoerigZu: faker.string.uuid(),
            });

            const permissions: IPersonPermissions = new PersonPermissionsMock();
            organisationRepositoryMock.findByIds.mockResolvedValueOnce(
                new Map([
                    [school.id, school],
                    [traeger.id, traeger],
                ]),
            );

            organisationRepositoryMock.findOrganisationZuordnungErsatzOderOeffentlich.mockResolvedValueOnce(
                RootDirectChildrenType.OEFFENTLICH,
            ); // OrganisationOnSameSubtree
            organisationRepositoryMock.findOrganisationZuordnungErsatzOderOeffentlich.mockResolvedValueOnce(
                RootDirectChildrenType.OEFFENTLICH,
            ); // OrganisationOnSameSubtree
            organisationRepositoryMock.findById.mockResolvedValueOnce(undefined); // SchuleUnterTraeger

            const result: Result<void> = await organisationService.setZugehoerigZu(traeger.id, school.id, permissions);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new SchuleUnterTraegerError(school.id),
            });
        });
    });

    describe('findAllAdministriertVon', () => {
        describe('when organizations are found', () => {
            it('should return all organizations', async () => {
                const parentId: string = faker.string.uuid();
                const organisation: Organisation<true> = DoFactory.createOrganisation(true);
                const organisations: Organisation<true>[] = [organisation];
                const total: number = organisations.length;

                organisationRepositoryMock.findBy.mockResolvedValue([organisations, total]);

                const result: Paged<Organisation<true>> = await organisationService.findAllAdministriertVon(parentId);

                expect(result).toEqual({
                    total: total,
                    offset: 0,
                    limit: total,
                    items: organisations,
                    pageTotal: total,
                });
            });
        });

        describe('when no organizations are found', () => {
            it('should return an empty list of organizations', async () => {
                const parentId: string = faker.string.uuid();
                organisationRepositoryMock.findBy.mockResolvedValue([[], 0]);

                const result: Paged<Organisation<true>> = await organisationService.findAllAdministriertVon(parentId);

                expect(result.items).toHaveLength(0);
                expect(result.items).toBeInstanceOf(Array);
            });
        });
    });

    describe('findAllZugehoerigZu', () => {
        describe('when organizations are found', () => {
            it('should return all organizations', async () => {
                const parentId: string = faker.string.uuid();
                const organisation: Organisation<true> = DoFactory.createOrganisation(true);
                const organisations: Organisation<true>[] = [organisation];
                const total: number = organisations.length;

                organisationRepositoryMock.findBy.mockResolvedValue([organisations, total]);

                const result: Paged<Organisation<true>> = await organisationService.findAllZugehoerigZu(parentId);

                expect(result).toEqual({
                    total: total,
                    offset: 0,
                    limit: total,
                    items: organisations,
                    pageTotal: total,
                });
            });
        });

        describe('when no organizations are found', () => {
            it('should return an empty list of organizations', async () => {
                const parentId: string = faker.string.uuid();
                organisationRepositoryMock.findBy.mockResolvedValue([[], 0]);

                const result: Paged<Organisation<true>> = await organisationService.findAllZugehoerigZu(parentId);

                expect(result.items).toHaveLength(0);
                expect(result.items).toBeInstanceOf(Array);
            });
        });
    });
});
