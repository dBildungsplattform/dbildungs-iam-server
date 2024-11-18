import { Test, TestingModule } from '@nestjs/testing';
import { StatusController } from './status.controller.js';
import { ConfigTestModule } from '../../../test/utils/index.js';

describe('StatusController', () => {
    let controller: StatusController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigTestModule],
            controllers: [StatusController],
        }).compile();

        controller = module.get<StatusController>(StatusController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
