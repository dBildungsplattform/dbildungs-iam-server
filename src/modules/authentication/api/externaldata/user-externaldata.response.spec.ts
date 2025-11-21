import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule } from '../../../../../test/utils';
import { EmailResolverService } from '../../../email-microservice/domain/email-resolver.service';
import { EmailMicroserviceModule } from '../../../email-microservice/email-microservice.module';
import { Person } from '../../../person/domain/person';
import { RollenArt } from '../../../rolle/domain/rolle.enums';
import { RequiredExternalPkData } from '../authentication.controller';
import { UserExeternalDataResponse } from './user-externaldata.response';
import { UserExeternalDataResponseOx } from './user-externaldata-ox.response';

// Tests just for linecoverage of ox creation logic
describe('UserExternaldataResponse', () => {
    let module: TestingModule;
    let emailResolverServiceMock: DeepMocked<EmailResolverService>;

    const mockPerson: Person<true> = createMock<Person<true>>({
        id: faker.string.uuid(),
        username: 'testuser',
        vorname: 'Test',
        familienname: 'User',
        email: faker.internet.email(),
    });
    const mockExternalPkData: DeepMocked<RequiredExternalPkData>[] = [
        createMock<RequiredExternalPkData>({
            rollenart: RollenArt.LEHR,
        }),
    ];
    const contextId: string = faker.string.uuid();

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                EmailMicroserviceModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
            ],
        })
            .overrideProvider(EmailResolverService)
            .useValue(createMock<EmailResolverService>())
            .compile();

        emailResolverServiceMock = module.get(EmailResolverService);
    });

    it('should create response without email microservice (username + contextId)', () => {
        emailResolverServiceMock.shouldUseEmailMicroservice.mockReturnValue(false);
        const result: UserExeternalDataResponse = UserExeternalDataResponse.createNew(
            mockPerson,
            mockExternalPkData,
            contextId,
            emailResolverServiceMock,
        );

        expect(result).toBeInstanceOf(UserExeternalDataResponse);
        expect(result.ox).toBeInstanceOf(UserExeternalDataResponseOx);
        expect(result.ox.id).toBe(`${mockPerson.username}@${contextId}`);
    });

    it('should create response using email microservice (only contextId)', () => {
        emailResolverServiceMock.shouldUseEmailMicroservice.mockReturnValue(true);
        const result: UserExeternalDataResponse = UserExeternalDataResponse.createNew(
            mockPerson,
            mockExternalPkData,
            contextId,
            emailResolverServiceMock,
        );

        expect(result).toBeInstanceOf(UserExeternalDataResponse);
        expect(result.ox).toBeInstanceOf(UserExeternalDataResponseOx);
        expect(result.ox.id).toBe(contextId);
    });
});
