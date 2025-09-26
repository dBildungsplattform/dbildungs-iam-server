import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { EmailAddressRepo } from './email-address.repo.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    MapperTestModule,
} from '../../../../../test/utils/index.js';
import { EmailAddressStatus } from './email-address.entity.js';
import { EmailAddress } from '../domain/email-address.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { SetEmailAddressForSpshPersonService } from '../domain/set-email-address-for-spsh-person.service.js';
import { EmailDomainRepo } from './email-domain.repo.js';
import { EmailCoreModule } from '../email-core.module.js';

describe('EmailRepo', () => {
    let module: TestingModule;
    let sut: EmailAddressRepo;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                EmailCoreModule,
            ],
            providers: [SetEmailAddressForSpshPersonService, EmailAddressRepo, EmailDomainRepo, ClassLogger],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();
        sut = module.get(EmailAddressRepo);
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

    async function createAndSaveMail(
        address?: string,
        priority?: number,
        status?: EmailAddressStatus,
        spshPersonId?: string,
        oxUserId?: string,
        markedForCron?: Date,
    ): Promise<EmailAddress<true>> {
        const mailToCreate: EmailAddress<false> = EmailAddress.createNew({
            address: address ?? faker.internet.email(),
            priority: priority ?? 1,
            status: status ?? EmailAddressStatus.PENDING,
            spshPersonId: spshPersonId ?? undefined,
            oxUserId: oxUserId ?? undefined,
            markedForCron: markedForCron ?? undefined,
        });
        const tmp: EmailAddress<true> | DomainError = await sut.save(mailToCreate);
        if (tmp instanceof DomainError) {
            throw tmp;
        }
        return tmp;
    }

    describe('existsEmailAddress', () => {
        let createdMail: EmailAddress<true>;

        beforeEach(async () => {
            createdMail = await createAndSaveMail();
        });

        it('should return true if email address exists', async () => {
            const result: boolean = await sut.existsEmailAddress(createdMail.address);
            expect(result).toBe(true);
        });

        it('should return false if email address does not exist', async () => {
            const result: boolean = await sut.existsEmailAddress(faker.internet.email());
            expect(result).toBe(false);
        });
    });
});
