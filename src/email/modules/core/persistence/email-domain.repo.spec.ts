import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { EmailAddressRepo } from './email-address.repo.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
} from '../../../../../test/utils/index.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { SetEmailAddressForSpshPersonService } from '../domain/set-email-address-for-spsh-person.service.js';
import { EmailDomainRepo } from './email-domain.repo.js';
import { EmailCoreModule } from '../email-core.module.js';
import { EmailDomain } from '../domain/email-domain.js';
import { EmailAddressStatusRepo } from './email-address-status.repo.js';
import { EmailAddressGenerator } from '../domain/email-address-generator.js';

describe('EmailDomainRepo', () => {
    let module: TestingModule;
    let sut: EmailDomainRepo;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), EmailCoreModule],
            providers: [
                SetEmailAddressForSpshPersonService,
                EmailAddressRepo,
                EmailDomainRepo,
                EmailAddressStatusRepo,
                ClassLogger,
                EmailAddressGenerator,
            ],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();
        sut = module.get(EmailDomainRepo);
        orm = module.get(MikroORM);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    async function createAndSaveDomain(domain?: string): Promise<EmailDomain<true>> {
        const mailToCreate: EmailDomain<false> = EmailDomain.createNew({ domain: domain ?? faker.internet.email() });
        const tmp: EmailDomain<true> | DomainError = await sut.save(mailToCreate);
        if (tmp instanceof DomainError) {
            throw tmp;
        }
        return tmp;
    }

    describe('existsEmailDomain', () => {
        let createdDomain: EmailDomain<true>;

        beforeEach(async () => {
            createdDomain = await createAndSaveDomain();
        });

        it('should return true if email domain exists', async () => {
            const result: Option<EmailDomain<true>> = await sut.findById(createdDomain.id);
            expect(result).toBeDefined();
            expect(result).not.toBeNull();
            expect(result).toBeInstanceOf(EmailDomain);
            expect((result as EmailDomain<true>).id).toBe(createdDomain.id);
            expect((result as EmailDomain<true>).domain).toBe(createdDomain.domain);
        });

        it('should return false if email domain does not exist', async () => {
            const result: Option<EmailDomain<true>> = await sut.findById(faker.string.uuid());
            expect(result).toBeNull();
        });
    });

    describe('.save', () => {
        it('should create a new email domain', async () => {
            const domainName: string = faker.internet.domainName();
            const mailToCreate: EmailDomain<false> = EmailDomain.createNew({ domain: domainName });
            const result: EmailDomain<true> | DomainError = await sut.save(mailToCreate);

            expect(result).toBeDefined();
            expect(result).not.toBeInstanceOf(DomainError);
            expect((result as EmailDomain<true>).domain).toBe(domainName);

            const persisted: Option<EmailDomain<true>> = await sut.findById((result as EmailDomain<true>).id);
            expect(persisted).toBeDefined();
            expect((persisted as EmailDomain<true>).domain).toBe(domainName);
        });

        it('should update an existing email domain', async () => {
            const originalDomain: string = faker.internet.domainName();
            const created: EmailDomain<true> = await createAndSaveDomain(originalDomain);

            const updatedDomainValue: string = faker.internet.domainName();
            const updatedDomain: EmailDomain<boolean> = new EmailDomain(
                created.id,
                created.createdAt,
                created.updatedAt,
                updatedDomainValue,
            );

            const result: EmailDomain<true> | DomainError = await sut.save(updatedDomain);

            expect(result).toBeDefined();
            expect(result).not.toBeInstanceOf(DomainError);
            expect((result as EmailDomain<true>).domain).toBe(updatedDomainValue);

            const persisted: Option<EmailDomain<true>> = await sut.findById(created.id);
            expect(persisted).toBeDefined();
            expect((persisted as EmailDomain<true>).domain).toBe(updatedDomainValue);
        });

        it('should return DomainError when updating a non-existent email domain', async () => {
            const nonExistentId: string = faker.string.uuid();
            const updatedDomainValue: string = faker.internet.domainName();
            const updatedDomain: EmailDomain<boolean> = new EmailDomain(
                nonExistentId,
                new Date(),
                new Date(),
                updatedDomainValue,
            );

            const result: EmailDomain<true> | DomainError = await sut.save(updatedDomain);

            expect(result).toBeInstanceOf(DomainError);
        });
    });
});
