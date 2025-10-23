import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailAddressStatusEnum } from '../../../email/modules/core/persistence/email-address-status.entity';
import { PersonEmailResponse } from '../../person/api/person-email-response';
import { Person } from '../../person/domain/person';
import { EmailAddressStatus } from '../domain/email-address';
import { EmailResolverService } from './email-resolver.service';
import { ConfigTestModule, DatabaseTestModule, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils';
import { ClassLogger } from '../../../core/logging/class-logger';
import { HttpService } from '@nestjs/axios';
import { EmailCoreModule } from '../../../email/modules/core/email-core.module';

describe('EmailResolverService', () => {
    let module: TestingModule;
    let sut: EmailResolverService;
    let orm: MikroORM;
    let mockHttpService: HttpService;

    const mockEmailInstanceConfig = {
        USE_EMAIL_MICROSERVICE: true,
        ENDPOINT: 'http://email-service/',
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), EmailCoreModule],
            providers: [EmailResolverService],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();

        sut = module.get(EmailResolverService);
        orm = module.get(MikroORM);
        mockHttpService = module.get(HttpService);

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

    it('should return email from microservice when enabled', async () => {
        const mockPerson: Person<true> = { id: faker.string.uuid() } as Person<true>;
        jest.spyOn(mockHttpService, 'get').mockReturnValueOnce({
            toPromise: () =>
                Promise.resolve({
                    data: [
                        {
                            address: 'test@example.com',
                            status: EmailAddressStatusEnum.ACTIVE,
                        },
                    ],
                }),
        } as any);

        const result = await sut.getEmailAddressAndStatusForPerson(mockPerson);
        expect(result).toEqual(
            new PersonEmailResponse(EmailAddressStatus.ENABLED, 'test@example.com'),
        );
    });

    it('should return undefined if microservice fails', async () => {
        const mockPerson: Person<true> = { id: faker.string.uuid() } as Person<true>;
        jest.spyOn(mockHttpService, 'get').mockImplementationOnce(() => {
            throw new Error('Microservice error');
        });

        const result = await sut.getEmailAddressAndStatusForPerson(mockPerson);
        expect(result).toBeUndefined();
    });

    it('should fallback to repo if microservice is disabled', async () => {
        const mockPerson: Person<true> = { id: faker.string.uuid() } as Person<true>;
        const emailRepo = module.get('EmailRepo');
        jest.spyOn(emailRepo, 'getEmailAddressAndStatusForPerson').mockResolvedValueOnce(
            new PersonEmailResponse(EmailAddressStatus.ENABLED, 'repo@example.com'),
        );

        mockEmailInstanceConfig.USE_EMAIL_MICROSERVICE = false;

        const result = await sut.getEmailAddressAndStatusForPerson(mockPerson);
        expect(result).toEqual(
            new PersonEmailResponse(EmailAddressStatus.ENABLED, 'repo@example.com'),
        );

        mockEmailInstanceConfig.USE_EMAIL_MICROSERVICE = true;
    });

    it('should map email status correctly', () => {
        expect(sut.mapStatus(EmailAddressStatusEnum.PENDING)).toBe(EmailAddressStatus.REQUESTED);
        expect(sut.mapStatus(EmailAddressStatusEnum.ACTIVE)).toBe(EmailAddressStatus.ENABLED);
        expect(sut.mapStatus(EmailAddressStatusEnum.DEACTIVE)).toBe(EmailAddressStatus.DISABLED);
        expect(sut.mapStatus(EmailAddressStatusEnum.SUSPENDED)).toBe(EmailAddressStatus.DISABLED);
        expect(sut.mapStatus(EmailAddressStatusEnum.TO_BE_DELETED)).toBe(EmailAddressStatus.DELETED);
    });
});
