import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    LoggingTestModule,
} from '../../../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../../../shared/validation/global-validation.pipe.js';
import { faker } from '@faker-js/faker';
import { EmailWriteController } from './email-write.controller.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SetEmailAddressForSpshPersonService } from '../../domain/set-email-address-for-spsh-person.service.js';
import { SetEmailAddressForSpshPersonParams } from '../dtos/params/set-email-addess-for-spsh-person.params.js';

describe('Email Write Controller', () => {
    let emailWriteController: EmailWriteController;
    let setEmailAddressForSpshPersonServiceMock: DeepMocked<SetEmailAddressForSpshPersonService>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                EmailWriteController,
                SetEmailAddressForSpshPersonService,
            ],
        })
            .overrideProvider(SetEmailAddressForSpshPersonService)
            .useValue(createMock<SetEmailAddressForSpshPersonService>())
            .compile();

        emailWriteController = module.get(EmailWriteController);
        setEmailAddressForSpshPersonServiceMock = module.get(SetEmailAddressForSpshPersonService);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('setEmailAddressForSpshPerson', () => {
        it('Should call setEmailAddressForSpshPersonService with right params', async () => {
            const params: SetEmailAddressForSpshPersonParams = {
                spshPersonId: faker.string.uuid(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                emailDomainId: faker.string.uuid(),
            };
            setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson.mockResolvedValue();
            await emailWriteController.setEmailForPerson(params);
            expect(setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson).toHaveBeenCalledWith(params);
        });
    });
});
