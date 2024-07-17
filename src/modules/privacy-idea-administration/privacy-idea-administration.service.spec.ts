import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service';

describe('PrivacyIdeaAdministrationService', () => {
  let service: PrivacyIdeaAdministrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrivacyIdeaAdministrationService],
    }).compile();

    service = module.get<PrivacyIdeaAdministrationService>(PrivacyIdeaAdministrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
