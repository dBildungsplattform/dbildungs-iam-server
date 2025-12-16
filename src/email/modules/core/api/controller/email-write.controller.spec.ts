import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS, LoggingTestModule } from '../../../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../../../shared/validation/global-validation.pipe.js';
import { faker } from '@faker-js/faker';
import { EmailWriteController } from './email-write.controller.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SetEmailAddressForSpshPersonService } from '../../domain/set-email-address-for-spsh-person.service.js';
import { SetEmailAddressForSpshPersonBodyParams } from '../dtos/params/set-email-address-for-spsh-person.bodyparams.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';
import { DeleteEmailsAddressesForSpshPersonService } from '../../domain/delete-email-adresses-for-spsh-person.service.js';
import { SetEmailSuspendedService } from '../../domain/set-email-suspended.service.js';

describe('Email Write Controller', () => {
    let emailWriteController: EmailWriteController;
    let setEmailAddressForSpshPersonServiceMock: DeepMocked<SetEmailAddressForSpshPersonService>;
    let setEmailSuspendedServiceMock: DeepMocked<SetEmailSuspendedService>;
    let deleteEmailsAddressesForSpshPersonServiceMock: DeepMocked<DeleteEmailsAddressesForSpshPersonService>;

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
                SetEmailSuspendedService,
                DeleteEmailsAddressesForSpshPersonService,
                ClassLogger,
            ],
        })
            .overrideProvider(SetEmailAddressForSpshPersonService)
            .useValue(createMock<SetEmailAddressForSpshPersonService>())
            .overrideProvider(DeleteEmailsAddressesForSpshPersonService)
            .useValue(createMock<DeleteEmailsAddressesForSpshPersonService>())
            .overrideProvider(SetEmailSuspendedService)
            .useValue(createMock<SetEmailSuspendedService>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();

        emailWriteController = module.get(EmailWriteController);
        setEmailAddressForSpshPersonServiceMock = module.get(SetEmailAddressForSpshPersonService);
        setEmailSuspendedServiceMock = module.get(SetEmailSuspendedService);
        deleteEmailsAddressesForSpshPersonServiceMock = module.get(DeleteEmailsAddressesForSpshPersonService);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('setEmailAddressForSpshPerson', () => {
        it('should resolve immediatly if setEmailAddressForSpshPerson succeeds', () => {
            const spshPersonId: string = faker.string.uuid();
            const bodyParams: SetEmailAddressForSpshPersonBodyParams = {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                spshServiceProviderId: faker.string.uuid(),
                kennungen: [],
                spshUsername: faker.internet.userName(),
            };
            setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson.mockResolvedValue();
            const result: void = emailWriteController.setEmailForPerson({ spshPersonId: spshPersonId }, bodyParams);
            expect(result).toBeUndefined();
            jest.runAllTimers();
            expect(setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson).toHaveBeenCalledWith({
                spshPersonId: spshPersonId,
                ...bodyParams,
            });
        });

        it('should resolve immediatly if setEmailAddressForSpshPerson fails', () => {
            const spshPersonId: string = faker.string.uuid();
            const bodyParams: SetEmailAddressForSpshPersonBodyParams = {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                spshServiceProviderId: faker.string.uuid(),
                kennungen: [],
                spshUsername: faker.internet.userName(),
            };
            setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson.mockRejectedValue(
                new Error('Test error'),
            );
            const result: void = emailWriteController.setEmailForPerson({ spshPersonId: spshPersonId }, bodyParams);
            expect(result).toBeUndefined();
            jest.runAllTimers();
            expect(setEmailAddressForSpshPersonServiceMock.setEmailAddressForSpshPerson).toHaveBeenCalledWith({
                spshPersonId: spshPersonId,
                ...bodyParams,
            });
        });
    });

    describe('deleteEmailsForPerson', () => {
        it('should resolve immediately if deleteEmailAddressesForSpshPerson succeeds', () => {
            const spshPersonId: string = faker.string.uuid();
            deleteEmailsAddressesForSpshPersonServiceMock.deleteEmailAddressesForSpshPerson.mockResolvedValue();

            const result: void = emailWriteController.deleteEmailsForPerson({ spshPersonId });
            expect(result).toBeUndefined();
            jest.runAllTimers();
            expect(
                deleteEmailsAddressesForSpshPersonServiceMock.deleteEmailAddressesForSpshPerson,
            ).toHaveBeenCalledWith({ spshPersonId });
        });

        it('should log error if deleteEmailAddressesForSpshPerson fails', () => {
            const spshPersonId: string = faker.string.uuid();
            const error: Error = new Error('Delete failed');
            deleteEmailsAddressesForSpshPersonServiceMock.deleteEmailAddressesForSpshPerson.mockRejectedValue(error);

            const result: void = emailWriteController.deleteEmailsForPerson({ spshPersonId });
            expect(result).toBeUndefined();
            jest.runAllTimers();
            expect(
                deleteEmailsAddressesForSpshPersonServiceMock.deleteEmailAddressesForSpshPerson,
            ).toHaveBeenCalledWith({ spshPersonId });
        });
    });

    describe('setEmailsSuspendedForSpshPerson', () => {
        it('should resolve immediatly if setEmailsSuspended succeeds', () => {
            const spshPersonId: string = faker.string.uuid();
            setEmailSuspendedServiceMock.setEmailsSuspended.mockResolvedValue();
            const result: void = emailWriteController.setEmailsSuspended({ spshPersonId: spshPersonId });
            expect(result).toBeUndefined();
            jest.runAllTimers();
            expect(setEmailSuspendedServiceMock.setEmailsSuspended).toHaveBeenCalledWith({
                spshPersonId: spshPersonId,
            });
        });

        it('should resolve immediatly if setEmailsSuspended fails', () => {
            const spshPersonId: string = faker.string.uuid();
            setEmailSuspendedServiceMock.setEmailsSuspended.mockRejectedValue(new Error('Test error'));
            const result: void = emailWriteController.setEmailsSuspended({ spshPersonId: spshPersonId });
            expect(result).toBeUndefined();
            jest.runAllTimers();
            expect(setEmailSuspendedServiceMock.setEmailsSuspended).toHaveBeenCalledWith({
                spshPersonId: spshPersonId,
            });
        });
    });
});
