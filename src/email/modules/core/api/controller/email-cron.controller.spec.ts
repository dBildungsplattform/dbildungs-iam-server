import { vi } from 'vitest';
import { createMock } from '../../../../../../test/utils/createMock.js';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_PIPE } from '@nestjs/core';
import { GlobalValidationPipe } from '../../../../../shared/validation/global-validation.pipe.js';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    LoggingTestModule,
} from '../../../../../../test/utils/index.js';
import { EmailOxModule } from '../../../ox/email-ox.module.js';
import { EmailCronController } from './email-cron.controller.js';
import { CronDeleteEmailsAddressesService } from '../../domain/cron-delete-email-addresses.service.js';

describe('EmailCronController', () => {
    let emailCronController: EmailCronController;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule, EmailOxModule, ConfigTestModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                EmailCronController,
                CronDeleteEmailsAddressesService,
            ],
        })
            .overrideProvider(CronDeleteEmailsAddressesService)
            .useValue(createMock(CronDeleteEmailsAddressesService))
            .compile();

        emailCronController = module.get(EmailCronController);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('findEmailAddress', () => {
        it('should call deleteEmails', () => {
            const result: void = emailCronController.deleteEmails();
            expect(result).toEqual(undefined);
        });
    });
});
