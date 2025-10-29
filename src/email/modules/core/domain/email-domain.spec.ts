import { faker } from '@faker-js/faker';
import { EmailDomain } from './email-domain.js';

describe('EmailDomain', () => {
    describe('createNew', () => {
        it('should create a new EmailDomain instance with WasPersisted=false', () => {
            const domain: string = faker.internet.domainName();
            const spshServiceProviderId: string = faker.string.uuid();
            const emailDomain: EmailDomain<false> = EmailDomain.createNew({ domain, spshServiceProviderId });

            expect(emailDomain).toBeInstanceOf(EmailDomain);
            expect(emailDomain.domain).toBe(domain);
            expect(emailDomain.id).toBeUndefined();
            expect(emailDomain.createdAt).toBeUndefined();
            expect(emailDomain.updatedAt).toBeUndefined();
        });
    });

    describe('construct', () => {
        it('should construct a persisted EmailDomain instance with all properties', () => {
            const id: string = faker.string.uuid();
            const createdAt: Date = faker.date.past();
            const updatedAt: Date = faker.date.past();
            const domain: string = faker.internet.domainName();
            const spshServiceProviderId: string = faker.string.uuid();

            const emailDomain: EmailDomain<true> = EmailDomain.construct({
                id,
                createdAt,
                updatedAt,
                domain,
                spshServiceProviderId,
            });

            expect(emailDomain).toBeInstanceOf(EmailDomain);
            expect(emailDomain.id).toBe(id);
            expect(emailDomain.createdAt).toBe(createdAt);
            expect(emailDomain.updatedAt).toBe(updatedAt);
            expect(emailDomain.domain).toBe(domain);
        });
    });
});
