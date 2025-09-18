import { envToOptionalBoolean, envToOptionalInteger, envToStringArray, mapStringsToRollenArt } from './utils.js';
import { RollenArt } from '../../modules/rolle/domain/rolle.enums.js';

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

    describe('envToStringArray', () => {
        it.each([
            ['', undefined],
            ['a,b,c', ['a', 'b', 'c']],
            ['a, b, c', ['a', 'b', 'c']],
        ])(
            'when environment variable is "%s", should return %s',
            (input: string | undefined, expected: string[] | undefined) => {
                process.env[TEST_KEY] = input;

                expect(envToStringArray(TEST_KEY)).toEqual(expected);
            },
        );

        it('should return undefined if the environment variable is not set', () => {
            delete process.env[TEST_KEY];

            expect(envToStringArray(TEST_KEY)).toBeUndefined();
        });
    });

    describe('mapStringsToRollenArt', () => {
        it('should map valid RollenArt strings to enum values', () => {
            const input: string[] = ['LERN', 'LEHR'];
            expect(mapStringsToRollenArt(input)).toEqual([RollenArt.LERN, RollenArt.LEHR]);
        });

        it('should filter out invalid RollenArt strings', () => {
            const input: string[] = ['LERN', 'INVALID', 'LEHR'];
            expect(mapStringsToRollenArt(input)).toEqual([RollenArt.LERN, RollenArt.LEHR]);
        });

        it('should return an empty array if no valid RollenArt strings are provided', () => {
            const input: string[] = ['INVALID1', 'INVALID2'];
            expect(mapStringsToRollenArt(input)).toEqual([]);
        });

        it('should return an empty array if input is an empty array', () => {
            expect(mapStringsToRollenArt([])).toEqual([]);
        });
    });
});
