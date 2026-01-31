import { Test, TestingModule } from '@nestjs/testing';
import { PersonenInfoController } from './personeninfo.controller.js';
import { PersonenInfoService } from '../../domain/personeninfo/personeninfo.service.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { PersonPermissions } from '../../../authentication/domain/person-permissions.js';
import { createMock, DeepMocked } from '../../../../../test/utils/createMock.js';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPersonPermissionsMock } from '../../../../../test/utils/auth.mock.js';

describe('PersonenInfoController', () => {
    let controller: PersonenInfoController;
    let service: PersonenInfoService;
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
        service = module.get<PersonenInfoService>(PersonenInfoService);
        configService = module.get(ConfigService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should parse offset and limit as integers', async () => {
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        await controller.infoV1(permissions, '5', '15');
        expect(service.findPersonsForPersonenInfo).toHaveBeenCalledWith(permissions, 5, 15);
    });

    it('should handle invalid offset and limit with fallback of page 1', async () => {
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        await controller.infoV1(permissions, 'invalid', 'invalid');
        expect(service.findPersonsForPersonenInfo).toHaveBeenCalledWith(permissions, 0, 2500);
    });

    it('should handle limit that exceeds maximum limit', async () => {
        const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
        try {
            await controller.infoV1(permissions, '0', '1000000');
            throw new Error('Expected exception was not thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(HttpException);
        }
    });
});
