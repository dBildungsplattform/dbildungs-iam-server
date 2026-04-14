import { Test, TestingModule } from '@nestjs/testing';
import { PersonenInfoController } from './personeninfo.controller.js';
import { PersonenInfoService } from '../../domain/personeninfo/personeninfo.service.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { PersonPermissions } from '../../../authentication/domain/person-permissions.js';
import { createMock, DeepMocked } from '../../../../../test/utils/createMock.js';
import { ConfigService } from '@nestjs/config';
import { createPersonPermissionsMock } from '../../../../../test/utils/auth.mock.js';
import { ExceedsLimitError } from '../../../../shared/error/exceeds-limit.error.js';
import { Ok } from '../../../../shared/util/result.js';
import { DomainError, EntityNotFoundError } from '../../../../shared/error/index.js';

describe('PersonenInfoController', () => {
    let controller: PersonenInfoController;
    let service: DeepMocked<PersonenInfoService>;
    let configService: DeepMocked<ConfigService>;

    beforeEach(async () => {
        configService = createMock(ConfigService);
        configService.getOrThrow.mockReturnValue({ LIMIT_PERSONENINFO: 2500 });
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PersonenInfoController],
            providers: [
                {
                    provide: PersonenInfoService,
                    useValue: createMock(PersonenInfoService),
                },
                {
                    provide: ClassLogger,
                    useValue: createMock(ClassLogger),
                },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        controller = module.get<PersonenInfoController>(PersonenInfoController);
        service = module.get<DeepMocked<PersonenInfoService>>(PersonenInfoService);
        configService = module.get<DeepMocked<ConfigService>>(ConfigService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should parse offset and limit as integers', async () => {
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        service.findPersonsForPersonenInfo.mockResolvedValue(Ok([]));

        await controller.infoV1(permissions, '5', '15');
        expect(service.findPersonsForPersonenInfo).toHaveBeenCalledWith(permissions, 5, 15);
    });

    it('should handle invalid offset and limit with fallback of page 1', async () => {
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        service.findPersonsForPersonenInfo.mockResolvedValue(Ok([]));

        await controller.infoV1(permissions, 'invalid', 'invalid');
        expect(service.findPersonsForPersonenInfo).toHaveBeenCalledWith(permissions, 0, 2500);
    });

    it('should handle limit that exceeds maximum limit', async () => {
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        await expect(controller.infoV1(permissions, '0', '1000000')).rejects.toBeInstanceOf(ExceedsLimitError);
    });

    it('should throw when service returns error', async () => {
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();

        service.findPersonsForPersonenInfo.mockResolvedValue({
            ok: false,
            error: new EntityNotFoundError('PersonenInfo', '123'),
        });

        await expect(controller.infoV1(permissions, '0', '10')).rejects.toBeInstanceOf(DomainError);
    });

    it('should fallback offset to 0 when offset is invalid', async () => {
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        service.findPersonsForPersonenInfo.mockResolvedValue(Ok([]));

        await controller.infoV1(permissions, 'invalid', '10');

        expect(service.findPersonsForPersonenInfo).toHaveBeenCalledWith(permissions, 0, 10);
    });

    it('should fallback limit to max when limit is invalid', async () => {
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        service.findPersonsForPersonenInfo.mockResolvedValue(Ok([]));

        await controller.infoV1(permissions, '5', 'invalid');

        expect(service.findPersonsForPersonenInfo).toHaveBeenCalledWith(
            permissions,
            5,
            controller['maxPersonenInfoLimit'],
        );
    });
});
