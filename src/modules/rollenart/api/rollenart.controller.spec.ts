import { RollenartController } from './rollenart.controller.js';
import { RollenartRepo } from '../repo/rollenart.repo.js';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('RollenartController', () => {
    let controller: RollenartController;
    let rollenartRepo: DeepMocked<RollenartRepo>;
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: RollenartRepo,
                    useValue: createMock<RollenartRepo>(),
                },
                RollenartController,
            ],
        }).compile();

        controller = module.get(RollenartController);
        rollenartRepo = module.get(RollenartRepo);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await module.close();
    });

    describe('getAllLmsRollenarten', () => {
        it('should return all rollenarten from the repository', () => {
            const rollenarten: string[] = ['Admin', 'User', 'Manager'];
            rollenartRepo.getAllRollenarten.mockReturnValueOnce(rollenarten);

            const result: string[] = controller.getAllLmsRollenarten();

            expect(result).toEqual(rollenarten);
            expect(rollenartRepo.getAllRollenarten).toHaveBeenCalledTimes(1);
        });

        it('should return an empty array if no rollenarten are found', () => {
            rollenartRepo.getAllRollenarten.mockReturnValueOnce([]);

            const result: string[] = controller.getAllLmsRollenarten();

            expect(result).toEqual([]);
            expect(rollenartRepo.getAllRollenarten).toHaveBeenCalledTimes(1);
        });
    });
});
