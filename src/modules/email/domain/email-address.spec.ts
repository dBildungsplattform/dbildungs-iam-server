import { Test, TestingModule } from '@nestjs/testing';
import { EmailAddress } from './email-address.js';
import { faker } from '@faker-js/faker';

describe('EmailAddress Aggregate', () => {
    let module: TestingModule;
    let personId: string;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        personId = faker.string.uuid();
    });

    describe('enabled', () => {
        describe('when email-address is enabled', () => {
            it('should return to true', () => {
                const emailAddress: EmailAddress<false> = EmailAddress.createNew(
                    personId,
                    faker.internet.email(),
                    true,
                );

                expect(emailAddress.enabled).toBeTruthy();
            });
        });

        describe('when email-address is NOT enabled', () => {
            it('should return to false', () => {
                const emailAddress: EmailAddress<false> = EmailAddress.createNew(
                    personId,
                    faker.internet.email(),
                    false,
                );

                expect(emailAddress.enabled).toBeFalsy();
            });
        });
    });

    describe('currentAddress', () => {
        describe('when email-address is enabled', () => {
            it('should return address', () => {
                const fakeEmail: string = faker.internet.email();
                const emailAddress: EmailAddress<false> = EmailAddress.createNew(
                    personId,
                    fakeEmail,
                    true,
                );

                const currentAddress: Option<string> = emailAddress.currentAddress;
                expect(currentAddress).toBeDefined();
                expect(currentAddress).toStrictEqual(fakeEmail);
            });
        });

        describe('when email-address is NOT enabled', () => {
            it('should return undefined', () => {
                const emailAddress: EmailAddress<false> = EmailAddress.createNew(
                    personId,
                    faker.internet.email(),
                    false,
                );

                expect(emailAddress.currentAddress).toBeFalsy();
            });
        });
    });
});
