import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { EmailModule } from './email.module.js';
import { EmailRepo } from './persistence/email.repo.js';
import { EmailFactory } from './domain/email.factory.js';
import { EmailGeneratorService } from './domain/email-generator.service.js';
import { createMock } from '@golevelup/ts-jest';
import { PersonRepository } from '../person/persistence/person.repository.js';
import { ClassLogger } from '../../core/logging/class-logger.js';

describe('EmailModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule, DatabaseTestModule.forRoot(), EmailModule],
            providers: [
                EmailRepo,
                EmailFactory,
                PersonRepository,
                {
                    provide: EmailGeneratorService,
                    useValue: createMock<EmailGeneratorService>(),
                },
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
            ],
        })
            .overrideProvider(EmailGeneratorService)
            .useValue(createMock<EmailGeneratorService>())
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())
            .compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve EmailRepo', () => {
            expect(module.get(EmailRepo)).toBeInstanceOf(EmailRepo);
        });

        it('should resolve EmailFactory', () => {
            expect(module.get(EmailFactory)).toBeInstanceOf(EmailFactory);
        });
    });
});
