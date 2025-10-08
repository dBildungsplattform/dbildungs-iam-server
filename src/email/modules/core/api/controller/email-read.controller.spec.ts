import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    LoggingTestModule,
} from '../../../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../../../shared/validation/global-validation.pipe.js';
import { EmailReadController } from './email-read.controller.js';
import { EmailAddressResponse } from '../dtos/response/email-address.response.js';
import { FindEmailAddressBySpshPersonIdParams } from '../dtos/params/find-email-address-by-spsh-person-id.params.js';
import { faker } from '@faker-js/faker';
import assert from 'assert';

describe('Email Read Controller', () => {
    let emailReadController: EmailReadController;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                EmailReadController,
            ],
        }).compile();

        emailReadController = module.get(EmailReadController);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('/GET EmailAddresses for personId, findEmailAddressesByPersonId', () => {
        it('should return dummy response', async () => {
            const params: FindEmailAddressBySpshPersonIdParams = {
                spshPersonId: faker.string.uuid(),
            };
            const response: EmailAddressResponse[] = await emailReadController.findEmailAddressesByPersonId(params);
            assert(response[0]);
            expect(response[0]).toEqual(
                expect.objectContaining({
                    address: 'test@schule-sh.de',
                }),
            );
        });
    });
});
