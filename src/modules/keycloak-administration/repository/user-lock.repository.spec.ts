import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
} from '../../../../test/utils/index.js';
import { UserLockRepository } from './user-lock.repository.js';
import { ConfigService } from '@nestjs/config';
import { MikroORM } from '@mikro-orm/core';
import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { UserLock } from '../domain/user.lock.js';
import { DuplicatePersonalnummerError } from '../../../shared/error/duplicate-personalnummer.error.js';
import { DomainError } from '../../../shared/error/domain.error.js';

describe('UserLockRepository', () => {
    let module: TestingModule;
    let sut: UserLockRepository;
    //let em: EntityManager;
    //let configService: ConfigService;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [
                UserLockRepository,
                {
                    provide: ConfigService,
                    useValue: createMock<ConfigService>({
                        getOrThrow: jest.fn().mockReturnValue({
                            ROOT_ORGANISATION_ID: faker.string.uuid(),
                        }),
                    }),
                },
            ],
        }).compile();

        sut = module.get(UserLockRepository);
        //em = module.get(EntityManager);
        //configService = module.get(ConfigService);
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

    describe('findById', () => {
        it('should return UserLock when found by personId', async () => {
            const userLock: UserLock<true> = UserLock.construct(faker.string.uuid(), faker.string.uuid(), new Date());

            const createdUserLock: UserLock<true> | DomainError = await sut.createUserLock(userLock);
            if (createdUserLock instanceof DomainError) throw new Error();
            expect(createdUserLock).toBeTruthy();

            const foundUserLock: Option<UserLock<true>> = await sut.findById(userLock.personId);

            expect(foundUserLock).toBeTruthy();
            expect(foundUserLock?.personId).toEqual(userLock.personId);
        });

        it('should return null when userLock is not found by personId', async () => {
            const personId: string = faker.string.uuid();
            const foundUserLock: Option<UserLock<true>> = await sut.findById(personId);

            expect(foundUserLock).toBeNull();
        });
    });

    describe('createUserLock', () => {
        it('should create and return a UserLock', async () => {
            const userLock: UserLock<true> = UserLock.construct(faker.string.uuid(), faker.string.uuid(), new Date());

            const createdUserLock: UserLock<true> | DomainError = await sut.createUserLock(userLock);
            if (createdUserLock instanceof DomainError) throw new Error();
            expect(createdUserLock).toBeTruthy();

            expect(createdUserLock.personId).toEqual(userLock.personId);
        });

        it('should return DuplicatePersonalnummerError when trying to create a duplicate UserLock', async () => {
            const userLock: UserLock<true> = UserLock.construct(faker.string.uuid(), faker.string.uuid(), new Date());

            const createdUserLock: UserLock<true> | DomainError = await sut.createUserLock(userLock);
            if (createdUserLock instanceof DomainError) throw new Error();
            expect(createdUserLock).toBeTruthy();

            const duplicateUserLock: UserLock<true> = UserLock.construct(
                userLock.personId,
                faker.string.uuid(),
                new Date(),
            );
            const result: UserLock<true> | DomainError = await sut.createUserLock(duplicateUserLock);
            expect(result).toBeInstanceOf(DuplicatePersonalnummerError);
        });
    });

    describe('update', () => {
        it('should update an existing UserLock', async () => {
            const userLock: UserLock<true> = UserLock.construct(faker.string.uuid(), faker.string.uuid(), new Date());

            const createdUserLock: UserLock<true> | DomainError = await sut.createUserLock(userLock);
            if (createdUserLock instanceof DomainError) throw new Error();
            expect(createdUserLock).toBeTruthy();

            createdUserLock.locked_by = faker.string.uuid();
            const updatedUserLock: UserLock<true> | DomainError = await sut.update(createdUserLock);
            if (updatedUserLock instanceof DomainError) throw new Error();
            expect(updatedUserLock).toBeTruthy();
            expect(updatedUserLock.locked_by).toEqual(createdUserLock.locked_by);
        });

        it('should throw error when trying to update a non-existent UserLock', async () => {
            const nonExistentUserLock: UserLock<true> = UserLock.construct(
                faker.string.uuid(),
                faker.string.uuid(),
                new Date(),
            );

            await expect(sut.update(nonExistentUserLock)).rejects.toThrowError();
        });
    });

    describe('deleteUserLock', () => {
        it('should delete UserLock by personId', async () => {
            const userLock: UserLock<true> = UserLock.construct(faker.string.uuid(), faker.string.uuid(), new Date());

            const createdUserLock: UserLock<true> | DomainError = await sut.createUserLock(userLock);
            if (createdUserLock instanceof DomainError) throw new Error();
            expect(createdUserLock).toBeTruthy();

            const result: Result<void, DomainError> = await sut.deleteUserLock(createdUserLock.personId);
            expect(result.ok).toBe(true);

            const foundUserLock: Option<UserLock<true>> = await sut.findById(createdUserLock.personId);
            expect(foundUserLock).toBeNull();
        });
    });
});
