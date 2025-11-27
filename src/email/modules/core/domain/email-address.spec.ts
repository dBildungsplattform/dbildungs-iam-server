import { faker } from '@faker-js/faker';
import { EmailAddress } from './email-address.js';

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
            });

            expect(emailDomain).toBeInstanceOf(EmailAddress);
            expect(emailDomain.id).toBe(id);
            expect(emailDomain.createdAt).toBe(createdAt);
            expect(emailDomain.updatedAt).toBe(updatedAt);
        });
    });
});
