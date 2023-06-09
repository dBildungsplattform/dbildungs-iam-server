import { Expose, plainToInstance } from 'class-transformer';

class Input {
    @Expose({ name: 'alter' })
    public age!: number;
}

describe('Playground', () => {
    it('should alter to age', () => {
        const json = {
            alter: 20,
        };
        const result = plainToInstance(Input, json);
        expect(result.age).toEqual(20);
    });
});
