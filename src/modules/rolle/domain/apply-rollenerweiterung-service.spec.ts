import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ApplyRollenerweiterungBodyParams } from '../api/apply-rollenerweiterung.body.params.js';
import { Rollenerweiterung } from './rollenerweiterung.js';
import { Rolle } from './rolle.js';
import { Ok } from '../../../shared/util/result.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { ApplyRollenerweiterungRolesError } from '../api/apply-rollenerweiterung-roles.error.js';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { ApplyRollenerweiterungService } from './apply-rollenerweiterungen-service.js';
import { MissingPermissionsError } from '../../../shared/error/index.js';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from './missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { Test, TestingModule } from '@nestjs/testing';
import {
    createPersonPermissionsMock,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';

type TresultType = Result<
    null,
    | ApplyRollenerweiterungRolesError
    | EntityNotFoundError
    | MissingPermissionsError
    | MissingMerkmalVerfuegbarFuerRollenerweiterungError
>;

describe('ApplyRollenerweiterungService', () => {
    let serviceProviderRepo: DeepMocked<ServiceProviderRepo>;
    let organisationRepo: DeepMocked<OrganisationRepository>;
    let rolleRepo: DeepMocked<RolleRepo>;
    let rollenerweiterungRepo: DeepMocked<RollenerweiterungRepo>;
    let service: ApplyRollenerweiterungService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                {
                    provide: RollenerweiterungRepo,
                    useValue: createMock(RollenerweiterungRepo),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock(OrganisationRepository),
                },
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock(ServiceProviderRepo),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock(RolleRepo),
                },
                ApplyRollenerweiterungService,
            ],
        }).compile();

        serviceProviderRepo = module.get(ServiceProviderRepo);
        organisationRepo = module.get(OrganisationRepository);
        rolleRepo = module.get(RolleRepo);
        rollenerweiterungRepo = module.get(RollenerweiterungRepo);
        service = module.get(ApplyRollenerweiterungService);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should add and remove Erweiterungen successfully', async () => {
        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();
        const rolleIdAdd: string = faker.string.uuid();
        const rolleIdRemove: string = faker.string.uuid();

        organisationRepo.findById.mockResolvedValue(DoFactory.createOrganisation(true, { id: orgaId }));
        serviceProviderRepo.findById.mockResolvedValue(
            DoFactory.createServiceProvider(true, {
                id: angebotId,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            }),
        );

        const existingErw: Rollenerweiterung<true> = createMock<Rollenerweiterung<true>>(Rollenerweiterung, {
            rolleId: rolleIdRemove,
        });
        rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId.mockResolvedValue([existingErw]);

        const rolleAdd: Rolle<true> = createMock<Rolle<true>>(Rolle);
        const rolleRemove: Rolle<true> = createMock<Rolle<true>>(Rolle);
        rolleRepo.findByIds.mockResolvedValue(
            new Map([
                [rolleIdAdd, rolleAdd],
                [rolleIdRemove, rolleRemove],
            ]),
        );

        rollenerweiterungRepo.createAuthorized.mockResolvedValue(
            Ok(createMock<Rollenerweiterung<true>>(Rollenerweiterung)),
        );
        rollenerweiterungRepo.deleteByComposedId.mockResolvedValue(Ok(null));

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [rolleIdAdd],
            removeErweiterungenForRolleIds: [rolleIdRemove],
        };
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

        const result: TresultType = await service.applyRollenerweiterungChanges(orgaId, angebotId, body, permissions);
        expect(result.ok).toBe(true);
        expect(rollenerweiterungRepo.createAuthorized).toHaveBeenCalled();
        expect(rollenerweiterungRepo.deleteByComposedId).toHaveBeenCalled();
    });

    it('should return error if Permissions are missing', async () => {
        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();

        organisationRepo.findById.mockResolvedValue(DoFactory.createOrganisation(true, { id: orgaId }));
        serviceProviderRepo.findById.mockResolvedValue(
            DoFactory.createServiceProvider(true, {
                id: angebotId,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            }),
        );
        rolleRepo.findByIds.mockResolvedValue(new Map());

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [],
            removeErweiterungenForRolleIds: [],
        };
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

        const result: TresultType = await service.applyRollenerweiterungChanges(orgaId, angebotId, body, permissions);
        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }
        expect(result.error).toBeInstanceOf(MissingPermissionsError);
        const err: unknown = result.error;
        if (!(err instanceof MissingPermissionsError)) {
            return;
        }
    });

    it('should return error if Organisation is missing', async () => {
        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();

        organisationRepo.findById.mockResolvedValue(undefined);
        serviceProviderRepo.findById.mockResolvedValue(
            DoFactory.createServiceProvider(true, {
                id: angebotId,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            }),
        );
        rolleRepo.findByIds.mockResolvedValue(new Map());

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [],
            removeErweiterungenForRolleIds: [],
        };
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

        const result: TresultType = await service.applyRollenerweiterungChanges(orgaId, angebotId, body, permissions);
        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }
        expect(result.error).toBeInstanceOf(EntityNotFoundError);
        const err: unknown = result.error;
        if (!(err instanceof EntityNotFoundError)) {
            return;
        }
    });

    it('should return error if Angebot is missing', async () => {
        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();

        organisationRepo.findById.mockResolvedValue(DoFactory.createOrganisation(true, { id: orgaId }));
        serviceProviderRepo.findById.mockResolvedValue(undefined);
        rolleRepo.findByIds.mockResolvedValue(new Map());

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [],
            removeErweiterungenForRolleIds: [],
        };
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

        const result: TresultType = await service.applyRollenerweiterungChanges(orgaId, angebotId, body, permissions);
        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }
        expect(result.error).toBeInstanceOf(EntityNotFoundError);
        const err: unknown = result.error;
        if (!(err instanceof EntityNotFoundError)) {
            return;
        }
    });

    it('should return error if Angebot is not erweiterbar', async () => {
        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();

        organisationRepo.findById.mockResolvedValue(DoFactory.createOrganisation(true, { id: orgaId }));
        serviceProviderRepo.findById.mockResolvedValue(
            DoFactory.createServiceProvider(true, { id: angebotId, merkmale: [] }),
        );
        rolleRepo.findByIds.mockResolvedValue(new Map());

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [],
            removeErweiterungenForRolleIds: [],
        };
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

        const result: TresultType = await service.applyRollenerweiterungChanges(orgaId, angebotId, body, permissions);
        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }
        expect(result.error).toBeInstanceOf(MissingMerkmalVerfuegbarFuerRollenerweiterungError);
        const err: unknown = result.error;
        if (!(err instanceof MissingMerkmalVerfuegbarFuerRollenerweiterungError)) {
            return;
        }
    });

    it('should return error if Rolle not found for add', async () => {
        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();
        const rolleId: string = faker.string.uuid();

        rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId.mockResolvedValue([]);
        rolleRepo.findByIds.mockResolvedValue(new Map());

        organisationRepo.findById.mockResolvedValue(DoFactory.createOrganisation(true, { id: orgaId }));
        serviceProviderRepo.findById.mockResolvedValue(
            DoFactory.createServiceProvider(true, {
                id: angebotId,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            }),
        );

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [rolleId],
            removeErweiterungenForRolleIds: [],
        };
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

        const result: TresultType = await service.applyRollenerweiterungChanges(orgaId, angebotId, body, permissions);
        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }
        expect(result.error).toBeInstanceOf(ApplyRollenerweiterungRolesError);
        const err: unknown = result.error;
        if (!(err instanceof ApplyRollenerweiterungRolesError)) {
            return;
        }
        expect(err.errors[0]?.id).toBe(rolleId);
        expect(err.errors[0]?.error).toBeInstanceOf(EntityNotFoundError);
    });

    it('should return error if Rolle not found for remove', async () => {
        const rolleIdRemove: string = faker.string.uuid();

        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();

        organisationRepo.findById.mockResolvedValue(DoFactory.createOrganisation(true, { id: orgaId }));
        serviceProviderRepo.findById.mockResolvedValue(
            DoFactory.createServiceProvider(true, {
                id: angebotId,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            }),
        );

        const existingErw: Rollenerweiterung<true> = createMock<Rollenerweiterung<true>>(Rollenerweiterung, {
            rolleId: rolleIdRemove,
        });
        rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId.mockResolvedValue([existingErw]);
        rolleRepo.findByIds.mockResolvedValue(new Map());

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [],
            removeErweiterungenForRolleIds: [rolleIdRemove],
        };
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

        const result: TresultType = await service.applyRollenerweiterungChanges(orgaId, angebotId, body, permissions);
        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }
        expect(result.error).toBeInstanceOf(ApplyRollenerweiterungRolesError);
        const err: unknown = result.error;
        if (!(err instanceof ApplyRollenerweiterungRolesError)) {
            return;
        }
        expect(err.errors[0]?.id).toBe(rolleIdRemove);
        expect(err.errors[0]?.error).toBeInstanceOf(EntityNotFoundError);
    });
});
