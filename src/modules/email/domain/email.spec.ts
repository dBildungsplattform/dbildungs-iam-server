import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Email } from './email.js';
import { faker } from '@faker-js/faker';
import { EmailAddress } from './email-address.js';

describe('Email Aggregate', () => {
    let module: TestingModule;
    let personId: string;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();
    });

    function getEmailAddress(enabled: boolean): EmailAddress<true> {
        return new EmailAddress<true>(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            personId,
            faker.internet.email(),
            enabled,
        );
    }

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        personId = faker.string.uuid();
    });

    describe('enable', () => {
        describe('when called', () => {
            it('should set enabled for address to true', () => {
                const emailAddress: EmailAddress<true> = getEmailAddress(false);
                const email: Email = Email.createNew(personId, emailAddress);
                email.enable();

                expect(email.emailAddress.enabled).toBeTruthy();
            });
        });
    });

    describe('disable', () => {
        describe('when called', () => {
            it('should set enabled for address to false', () => {
                const emailAddress: EmailAddress<true> = getEmailAddress(true);
                const email: Email = Email.createNew(personId, emailAddress);
                email.disable();

                expect(email.emailAddress.enabled).toBeFalsy();
            });
        });
    });

    describe('isEnabled', () => {
        describe('when address is enabled', () => {
            it('should return true', () => {
                const emailAddress: EmailAddress<true> = getEmailAddress(true);
                const email: Email = Email.createNew(personId, emailAddress);

                expect(email.isEnabled()).toBeTruthy();
            });
        });

        describe('when address is NOT enabled', () => {
            it('should return false', () => {
                const emailAddress: EmailAddress<true> = getEmailAddress(false);
                const email: Email = Email.createNew(personId, emailAddress);

                expect(email.isEnabled()).toBeFalsy();
            });
        });
    });

    describe('get currentAddress', () => {
        describe('when address is enabled', () => {
            it('should return address', () => {
                const emailAddress: EmailAddress<true> = getEmailAddress(true);
                const email: Email = Email.createNew(personId, emailAddress);

                expect(email.currentAddress).toBeDefined();
            });
        });

        describe('when address is NOT enabled', () => {
            it('should return undefined', () => {
                const emailAddress: EmailAddress<true> = getEmailAddress(false);
                const email: Email = Email.createNew(personId, emailAddress);

                expect(email.currentAddress).toBeUndefined();
            });
        });
    });
});
