import { plainToInstance } from 'class-transformer';
import { TransformToBoolean } from './boolean-transform.validator';

class TestClass {
    @TransformToBoolean()
    public value!: boolean;
}

describe('TransformToBoolean', () => {
    it('should convert "true" to true', () => {
        const testInstance: TestClass = plainToInstance(TestClass, {
            value: 'true',
        });

        expect(testInstance.value).toEqual(true);
    });

    it('should convert "1" to true', () => {
        const testInstance: TestClass = plainToInstance(TestClass, {
            value: '1',
        });

        expect(testInstance.value).toEqual(true);
    });

    it('should convert "false" to false', () => {
        const testInstance: TestClass = plainToInstance(TestClass, {
            value: 'false',
        });

        expect(testInstance.value).toEqual(false);
    });

    it('should convert "0" to false', () => {
        const testInstance: TestClass = plainToInstance(TestClass, {
            value: '0',
        });

        expect(testInstance.value).toEqual(false);
    });

    it('should keep value undefined when property is omitted', () => {
        const testInstance: TestClass = plainToInstance(TestClass, {});
        expect(testInstance.value).toBeUndefined();
    });

    it('should keep value undefined when value is explicitly undefined', () => {
        const testInstance: TestClass = plainToInstance(TestClass, {
            value: undefined,
        });
        expect(testInstance.value).toBeUndefined();
    });
});
