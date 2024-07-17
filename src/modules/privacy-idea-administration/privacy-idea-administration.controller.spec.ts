import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyIdeaAdministrationController } from './privacy-idea-administration.controller';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service';

describe('PrivacyIdeaAdministrationController', () => {
    let controller: PrivacyIdeaAdministrationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PrivacyIdeaAdministrationController],
            providers: [PrivacyIdeaAdministrationService],
        }).compile();

        controller = module.get<PrivacyIdeaAdministrationController>(PrivacyIdeaAdministrationController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
