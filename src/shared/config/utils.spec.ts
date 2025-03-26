import { envToOptionalBoolean, envToOptionalInteger } from './utils.js';

const TEST_KEY: string = 'CONFIG_UTIL_TEST_KEY';

describe('Config Utils', () => {
    describe('envToOptionalBoolean', () => {
        it.each([
            ['', undefined],
            ['true', true],
            ['TRUE', true],
            ['false', false],
            ['FALSE', false],
        ])(
            'when environment variable is "%s", should return %s',
            (input: string | undefined, expected: boolean | undefined) => {
                process.env[TEST_KEY] = input;

                expect(envToOptionalBoolean(TEST_KEY)).toBe(expected);
            },
        );

        it('should throw error, if the environment variable is set to an invalid string', () => {
            process.env[TEST_KEY] = 'INVALID';

            expect(() => envToOptionalBoolean(TEST_KEY)).toThrow();
        });
    });

    describe('envToOptionalInteger', () => {
        it.each([
            ['', undefined],
            ['0', 0],
            ['15', 15],
            ['-15', -15],
        ])(
            'when environment variable is "%s", should return %s',
            (input: string | undefined, expected: number | undefined) => {
                process.env[TEST_KEY] = input;

                expect(envToOptionalInteger(TEST_KEY)).toBe(expected);
            },
        );

        it('should throw error, if the environment variable is set to an invalid number', () => {
            process.env[TEST_KEY] = 'INVALID';

            expect(() => envToOptionalInteger(TEST_KEY)).toThrow();
        });
    });
});
