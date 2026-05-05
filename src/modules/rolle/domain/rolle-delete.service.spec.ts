import { Test, TestingModule } from '@nestjs/testing';

import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/timeouts.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { RolleDeleteService } from './rolle-delete.service.js';
import { RolleHatPersonenkontexteError } from './rolle-hat-personenkontexte.error.js';
import { Rolle } from './rolle.js';

describe('RolleDeleteService', () => {
    let module: TestingModule;
    let service: RolleDeleteService;
    let rolleRepo: DeepMocked<RolleRepo>;
    let rollenerweiterungRepo: DeepMocked<RollenerweiterungRepo>;
    let personenkontextRepo: DeepMocked<DBiamPersonenkontextRepo>;
    let permissions: DeepMocked<PersonPermissions>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                RolleDeleteService,
                {
                    provide: RolleRepo,
                    useValue: createMock(RolleRepo),
                },
                {
                    provide: RollenerweiterungRepo,
                    useValue: createMock(RollenerweiterungRepo),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock(DBiamPersonenkontextRepo),
                },
            ],
        }).compile();

        service = module.get(RolleDeleteService);
        rolleRepo = module.get(RolleRepo);
        rollenerweiterungRepo = module.get(RollenerweiterungRepo);
        personenkontextRepo = module.get(DBiamPersonenkontextRepo);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        vi.resetAllMocks();
        permissions = createMock(PersonPermissions);
    });

    it('should return permission errors without deleting anything', async () => {
        const error: MissingPermissionsError = new MissingPermissionsError('dummy error');

        rolleRepo.findByIdAuthorized.mockResolvedValueOnce({ ok: false, error });

        await expect(service.delete('rolle-id', permissions)).resolves.toBe(error);
        expect(rollenerweiterungRepo.deleteByRolleId).not.toHaveBeenCalled();
        expect(rolleRepo.deleteInternal).not.toHaveBeenCalled();
    });

    it('should delete rollenerweiterungen before deleting the rolle', async () => {
        rolleRepo.findByIdAuthorized.mockResolvedValueOnce({
            ok: true,
            value: createMock<Rolle<true>>(Rolle),
        });
        rollenerweiterungRepo.deleteByRolleId.mockResolvedValueOnce();
        rolleRepo.deleteInternal.mockResolvedValueOnce(undefined);
        personenkontextRepo.existsByRolleId.mockResolvedValueOnce(false);

        await expect(service.delete('rolle-id', permissions)).resolves.toBeUndefined();
        expect(rollenerweiterungRepo.deleteByRolleId).toHaveBeenCalledWith('rolle-id');
        expect(rolleRepo.deleteInternal).toHaveBeenCalledWith('rolle-id');
    });

    it('should return RolleHatPersonenkontexteError before deleting anything', async () => {
        rolleRepo.findByIdAuthorized.mockResolvedValueOnce({
            ok: true,
            value: createMock<Rolle<true>>(Rolle),
        });
        personenkontextRepo.existsByRolleId.mockResolvedValueOnce(true);

        await expect(service.delete('rolle-id', permissions)).resolves.toBeInstanceOf(RolleHatPersonenkontexteError);
        expect(rollenerweiterungRepo.deleteByRolleId).not.toHaveBeenCalled();
        expect(rolleRepo.deleteInternal).not.toHaveBeenCalled();
    });
});
