import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { EmailEventHandler } from './email-event-handler.js';
import { EmailProviderAttachedEvent } from '../../../shared/events/email-provider-attached-event.js';
import { faker } from '@faker-js/faker';
import { EmailProviderDetachedEvent } from '../../../shared/events/email-provider-detached-event.js';
import { EmailModule } from '../email.module.js';
import { EmailGeneratorService } from './email-generator.service.js';
import { createMock } from '@golevelup/ts-jest';

describe('Email Event Handler', () => {
    let app: INestApplication;

    let emailEventHandler: EmailEventHandler;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigTestModule, EmailModule, DatabaseTestModule.forRoot({ isDatabaseRequired: false })],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        })
            .overrideProvider(EmailGeneratorService)
            .useValue(createMock<EmailGeneratorService>())
            .overrideProvider(EmailEventHandler)
            .useClass(EmailEventHandler)
            .compile();

        emailEventHandler = module.get(EmailEventHandler);

        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('asyncEmailProviderAttachedEventHandler', () => {
        describe('when called', () => {
            it('should execute without errors', async () => {
                const event: EmailProviderAttachedEvent = new EmailProviderAttachedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                const result: void = await emailEventHandler.asyncEmailProviderAttachedEventHandler(event);
                expect(result).toBeUndefined();
            });
        });
    });

    describe('asyncEmailProviderDetachedEventHandler', () => {
        describe('when called', () => {
            it('should execute without errors', async () => {
                const event: EmailProviderDetachedEvent = new EmailProviderDetachedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                );

                const result: void = await emailEventHandler.asyncEmailProviderDetachedEventHandler(event);
                expect(result).toBeUndefined();
            });
        });
    });
});
