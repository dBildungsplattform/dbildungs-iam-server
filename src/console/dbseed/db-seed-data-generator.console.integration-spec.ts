import { Test, TestingModule } from '@nestjs/testing';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS, LoggingTestModule } from '../../../test/utils/index.js';
import { DbSeedDataGeneratorConsole } from './db-seed-data-generator.console.js';

describe('DbSeedDataGeneratorConsoleIntegration', () => {
    let module: TestingModule;
    let sut: DbSeedDataGeneratorConsole;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [DbSeedDataGeneratorConsole],
        }).compile();
        sut = module.get(DbSeedDataGeneratorConsole);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('run', () => {
        describe('when parameter for numberOfSchools and classesPerSchool are provided and values are valid', () => {
            it('should NOT fail', async () => {
                const params: string[] = [
                    'seeding/seeding-integration-test/organisation/',
                    'numberOfSchools=1',
                    'classesPerSchool=3',
                ];
                await expect(sut.run(params)).resolves.not.toThrow();
            });
        });

        describe('when the directory is not provided', () => {
            it('should fail with error', async () => {
                await expect(sut.run([])).rejects.toThrow(new Error('No directory provided!'));
            });
        });

        describe('when the parameter numberOfSchools is not provided', () => {
            it('should fail with error', async () => {
                await expect(sut.run(['seeding/seeding-integration-test/organisation/'])).rejects.toThrow(
                    new Error('The parameter numberOfSchools was not provided'),
                );
            });
        });

        describe('when the parameter classesPerSchool is not provided', () => {
            it('should fail with error', async () => {
                const params: string[] = ['seeding/seeding-integration-test/organisation/', 'numberOfSchools=50'];
                await expect(sut.run(params)).rejects.toThrow(
                    new Error('The parameter classesPerSchool was not provided'),
                );
            });
        });

        describe('when the value of parameter numberOfSchools is negative', () => {
            it('should fail with error', async () => {
                const params: string[] = [
                    'seeding/seeding-integration-test/organisation/',
                    'numberOfSchools=-1',
                    'classesPerSchool=10',
                ];
                await expect(sut.run(params)).rejects.toThrow(
                    Error('The value for numberOfSchools provided muss be greater than 0'),
                );
            });
        });

        describe('when the value of parameter numberOfSchools is 0', () => {
            it('should fail with error', async () => {
                const params: string[] = [
                    'seeding/seeding-integration-test/organisation/',
                    'numberOfSchools=0',
                    'classesPerSchool=10',
                ];
                await expect(sut.run(params)).rejects.toThrow(
                    Error('The value for numberOfSchools provided muss be greater than 0'),
                );
            });
        });

        describe('when the value of parameter classesPerSchool is negative', () => {
            it('should fail with error', async () => {
                const params: string[] = [
                    'seeding/seeding-integration-test/organisation/',
                    'numberOfSchools=1',
                    'classesPerSchool=-1',
                ];
                await expect(sut.run(params)).rejects.toThrow(
                    Error('The value for classesPerSchool provided muss be greater than 0'),
                );
            });
        });

        describe('when the value of parameter classesPerSchool is 0', () => {
            it('should fail with error', async () => {
                const params: string[] = [
                    'seeding/seeding-integration-test/organisation/',
                    'numberOfSchools=2',
                    'classesPerSchool=0',
                ];
                await expect(sut.run(params)).rejects.toThrow(
                    Error('The value for classesPerSchool provided muss be greater than 0'),
                );
            });
        });

        describe('when the value of parameter classesPerSchool is not divisible by 3', () => {
            it('should fail with error', async () => {
                const params: string[] = [
                    'seeding/seeding-integration-test/organisation/',
                    'numberOfSchools=50',
                    'classesPerSchool=1',
                ];
                await expect(sut.run(params)).rejects.toThrow(
                    Error('The value for classesPerSchool provided muss be divisible by 3'),
                );
            });
        });

        describe('if directory cannot be found', () => {
            it('should fail with error', async () => {
                const params: string[] = [
                    'seeding/seeding-integration-test/fakeDir/',
                    'numberOfSchools=2',
                    'classesPerSchool=3',
                ];
                await expect(sut.run(params)).rejects.toThrow();
            });
        });
    });
});
