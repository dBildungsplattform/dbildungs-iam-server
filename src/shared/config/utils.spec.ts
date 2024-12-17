import { envToOptionalBoolean } from './utils.js';

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
});
