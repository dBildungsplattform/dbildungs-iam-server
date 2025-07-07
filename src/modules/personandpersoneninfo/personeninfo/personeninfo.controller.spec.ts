import { Test, TestingModule } from '@nestjs/testing';
import { PersonenInfoController } from './personeninfo.controller.js';
import { PersonenInfoService } from './personeninfo.service.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('PersonenInfoController', () => {
    let controller: PersonenInfoController;
    let service: PersonenInfoService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PersonenInfoController],
            providers: [
                {
                    provide: PersonenInfoService,
                    useValue: createMock<PersonenInfoService>(),
                },
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
            ],
        }).compile();

        controller = module.get<PersonenInfoController>(PersonenInfoController);
        service = module.get<PersonenInfoService>(PersonenInfoService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should parse offset and limit as integers', async () => {
        const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
        await controller.infoV1(permissions, '5', '15');
        expect(service.findPersonsForPersonenInfo).toHaveBeenCalledWith(permissions, 5, 15);
    });

    it('should handle invalid offset and limit with fallback of page 1', async () => {
        const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
        await controller.infoV1(permissions, 'invalid', 'invalid');
        expect(service.findPersonsForPersonenInfo).toHaveBeenCalledWith(permissions, 0, 25);
    });
});
