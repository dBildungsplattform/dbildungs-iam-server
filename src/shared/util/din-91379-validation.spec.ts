import { ValidationError, validateSync } from 'class-validator';
import { IsDIN91379A, IsDIN91379AEXT, toDIN91379SearchForm } from './din-91379-validation.js';
import { plainToInstance } from 'class-transformer';

class TestClass {
    @IsDIN91379A()
    public testValue1: string;

    @IsDIN91379AEXT()
    public testValue2: string;

    public constructor(value1: string, value2: string) {
        this.testValue1 = value1;
        this.testValue2 = value2;
    }
}

describe('DIN 91379', () => {
    describe('toSearchForm', () => {
        it('should return search form', () => {
            const input: string = 'Test';

            const output: string = toDIN91379SearchForm(input);

            expect(output).toBe('TEST');
        });

        it('should return replace defined character', () => {
            const input: string = 'Lunâtiz';

            const output: string = toDIN91379SearchForm(input);

            expect(output).toBe('LUNATIZ');
        });

        it('should keep all other characters as is', () => {
            const input: string = '?Lunâtiz?';

            const output: string = toDIN91379SearchForm(input);

            expect(output).toBe('?LUNATIZ?');
        });
    });

    describe('validation decorators', () => {
        describe('transform', () => {
            it('should normalize strings to NFC', () => {
                const testInstance: TestClass = plainToInstance(TestClass, {
                    testValue1: '\u0065\u0300',
                    testValue2: '\u0065\u0300',
                });

                expect(testInstance.testValue1).toEqual('\u00E8');
                expect(testInstance.testValue2).toEqual('\u00E8');
            });

            it('should convert other inputs to undefined', () => {
                const testInstance: TestClass = plainToInstance(TestClass, {
                    testValue1: 1,
                    testValue2: 2,
                });

                expect(testInstance.testValue1).toBeUndefined();
                expect(testInstance.testValue2).toBeUndefined();
            });
        });

        describe('validate', () => {
            it('should test strings for format', () => {
                const testInstance: TestClass = plainToInstance(TestClass, {
                    testValue1: '\u0065\u0300',
                    testValue2: '\u0065\u0300',
                });

                const result: ValidationError[] = validateSync(testInstance);

                expect(result).toHaveLength(0);
            });
        });
    });
});
