import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyIdeaAdministrationController } from './privacy-idea-administration.controller';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service';
import { HttpService } from '@nestjs/axios'; // Import HttpService if it's not already

describe('PrivacyIdeaAdministrationController', () => {
    let controller: PrivacyIdeaAdministrationController;
    let service: PrivacyIdeaAdministrationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PrivacyIdeaAdministrationController],
            providers: [
                PrivacyIdeaAdministrationService,
                {
                    provide: HttpService,
                    useValue: { // Mock HttpService
                        post: jest.fn() // Mock the methods you need
                    },
                },
            ],
        }).compile();

        controller = module.get<PrivacyIdeaAdministrationController>(PrivacyIdeaAdministrationController);
        service = module.get<PrivacyIdeaAdministrationService>(PrivacyIdeaAdministrationService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
        expect(service).toBeDefined();
    });
});
