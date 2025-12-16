import { faker } from '@faker-js/faker';
import { EmailAddress } from './email-address.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';

describe('EmailAddress', () => {
    describe('createNew', () => {
        it('should create a new non peristed EmailAddress instance', () => {
            const mailToCreate: EmailAddress<false> = EmailAddress.createNew({
                address: faker.internet.email(),
                priority: 1,
                spshPersonId: faker.string.uuid(),
                oxUserCounter: undefined,
                markedForCron: undefined,
                externalId: faker.string.uuid(),
            });

            expect(mailToCreate).toBeInstanceOf(EmailAddress);
            expect(mailToCreate.createdAt).toBeUndefined();
            expect(mailToCreate.updatedAt).toBeUndefined();
        });
    });

    describe('construct', () => {
        it('should construct a persisted EmailAddress instance with all properties', () => {
            const id: string = faker.string.uuid();
            const createdAt: Date = faker.date.past();
            const updatedAt: Date = faker.date.past();

            const emailDomain: EmailAddress<true> = EmailAddress.construct({
                id: id,
                createdAt: createdAt,
                updatedAt: updatedAt,
                address: faker.internet.email(),
                priority: 1,
                spshPersonId: faker.string.uuid(),
                oxUserCounter: undefined,
                markedForCron: undefined,
                externalId: faker.string.uuid(),
                sortedStatuses: [],
            });

            expect(emailDomain).toBeInstanceOf(EmailAddress);
            expect(emailDomain.id).toBe(id);
            expect(emailDomain.createdAt).toBe(createdAt);
            expect(emailDomain.updatedAt).toBe(updatedAt);
        });
    });

    describe('setStatus', () => {
        it('should add status when it is different', () => {
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
                address: faker.internet.email(),
                priority: 1,
                spshPersonId: faker.string.uuid(),
                oxUserCounter: undefined,
                markedForCron: undefined,
                externalId: faker.string.uuid(),
                sortedStatuses: [],
            });

            address.setStatus(EmailAddressStatusEnum.ACTIVE);

            expect(address.sortedStatuses).toHaveLength(1);
            expect(address.getStatus()).toBe(EmailAddressStatusEnum.ACTIVE);
        });

        it('should not add status when it is the same', () => {
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
                address: faker.internet.email(),
                priority: 1,
                spshPersonId: faker.string.uuid(),
                oxUserCounter: undefined,
                markedForCron: undefined,
                externalId: faker.string.uuid(),
                sortedStatuses: [],
            });

            address.setStatus(EmailAddressStatusEnum.ACTIVE);
            address.setStatus(EmailAddressStatusEnum.ACTIVE);

            expect(address.sortedStatuses).toHaveLength(1);
            expect(address.getStatus()).toBe(EmailAddressStatusEnum.ACTIVE);
        });
    });

    describe('getDomain', () => {
        it('should return the domain when address contains "@"', () => {
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
                address: 'testus@schule-sh.de',
                priority: 1,
                spshPersonId: faker.string.uuid(),
                oxUserCounter: undefined,
                markedForCron: undefined,
                externalId: faker.string.uuid(),
                sortedStatuses: [],
            });
            expect(address.getDomain()).toBe('schule-sh.de');
        });

        it('should return undefined when address does not contain "@"', () => {
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
                address: 'invalid',
                priority: 1,
                spshPersonId: faker.string.uuid(),
                oxUserCounter: undefined,
                markedForCron: undefined,
                externalId: faker.string.uuid(),
                sortedStatuses: [],
            });
            expect(address.getDomain()).toBeUndefined();
        });

        it('should return empty string if "@" is the last character', () => {
            const address: EmailAddress<true> = EmailAddress.construct({
                id: faker.string.uuid(),
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
                address: 'xy@',
                priority: 1,
                spshPersonId: faker.string.uuid(),
                oxUserCounter: undefined,
                markedForCron: undefined,
                externalId: faker.string.uuid(),
                sortedStatuses: [],
            });
            expect(address.getDomain()).toBe('');
        });
    });
});
