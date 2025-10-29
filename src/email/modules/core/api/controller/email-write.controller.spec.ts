import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS, LoggingTestModule } from '../../../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../../../shared/validation/global-validation.pipe.js';
import { faker } from '@faker-js/faker';
import { EmailWriteController } from './email-write.controller.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SetEmailAddressForSpshPersonService } from '../../domain/set-email-address-for-spsh-person.service.js';
import { SetEmailAddressForSpshPersonParams } from '../dtos/params/set-email-address-for-spsh-person.params.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';

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
                ClassLogger,
            ],
        })
            .overrideProvider(SetEmailAddressForSpshPersonService)
            .useValue(createMock<SetEmailAddressForSpshPersonService>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();

        emailWriteController = module.get(EmailWriteController);
        setEmailAddressForSpshPersonServiceMock = module.get(SetEmailAddressForSpshPersonService);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('setEmailAddressForSpshPerson', () => {
        it('should resolve immediatly if setEmailAddressForSpshPerson succeeds', () => {
            const params: SetEmailAddressForSpshPersonParams = {
                spshPersonId: faker.string.uuid(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                emailDomainId: faker.string.uuid(),
                kennungen: [],
                spshUsername: faker.internet.userName(),
            };
            setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson.mockResolvedValue();
            const result: void = emailWriteController.setEmailForPerson(params);
            expect(result).toBeUndefined();
            jest.runAllTimers();
            expect(setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson).toHaveBeenCalledWith(params);
        });

        it('should resolve immediatly if setEmailAddressForSpshPerson fails', () => {
            const params: SetEmailAddressForSpshPersonParams = {
                spshPersonId: faker.string.uuid(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                emailDomainId: faker.string.uuid(),
                kennungen: [],
                spshUsername: faker.internet.userName(),
            };
            setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson.mockRejectedValue(
                new Error('Test error'),
            );
            const result: void = emailWriteController.setEmailForPerson(params);
            expect(result).toBeUndefined();
            jest.runAllTimers();
            expect(setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson).toHaveBeenCalledWith(params);
        });
    });
});
