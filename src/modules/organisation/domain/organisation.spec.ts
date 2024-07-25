import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { MapperTestModule } from '../../../../test/utils/mapper-test.module.js';
import { Organisation } from './organisation.js';
import { NameValidationError } from '../../../shared/error/name-validation.error.js';

describe('Organisation', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule],
            providers: [],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('construct', () => {
        it('should return persisted organisation', () => {
            const organisation: Organisation<true> = Organisation.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.string.uuid(),
                undefined,
                undefined,
            );

            expect(organisation).toBeDefined();
            expect(organisation).toBeInstanceOf(Organisation<true>);
        });
    });

    describe('createNew', () => {
        it('should return non pesisted organisation', () => {
            const organisation: Organisation<false> = Organisation.createNew(
                faker.string.uuid(),
                faker.string.uuid(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.string.uuid(),
                undefined,
                undefined,
            );

            expect(organisation).toBeDefined();
            expect(organisation).toBeInstanceOf(Organisation<false>);
        });
        it('should return non persisted organisation', () => {
            const organisation: Organisation<false> = Organisation.createNew(
                faker.string.uuid(),
                faker.string.uuid(),
                'kennung',
                'name',
                faker.lorem.word(),
                faker.string.uuid(),
                undefined,
                undefined,
            );

            expect(organisation).toBeDefined();
            expect(organisation).toBeInstanceOf(Organisation<false>);
        });

        it('should throw an error if name has leading whitespace', () => {
            expect(() =>
                Organisation.createNew(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    'kennung',
                    ' Test',
                    faker.lorem.word(),
                    faker.string.uuid(),
                    undefined,
                    undefined,
                ),
            ).toThrow(NameValidationError);
        });

        it('should throw an error if dienststellennummer has leading whitespace', () => {
            expect(() =>
                Organisation.createNew(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    ' Test',
                    'name',
                    faker.lorem.word(),
                    faker.string.uuid(),
                    undefined,
                    undefined,
                ),
            ).toThrow(NameValidationError);
        });
    });
});
