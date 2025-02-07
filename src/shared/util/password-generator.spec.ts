import { generatePassword } from './password-generator.js';

describe('passwordGenerator', () => {
    test('should generate a non-empty password', () => {
        const password: string = generatePassword();
        expect(password).toBeTruthy();
        expect(password.length).toBeGreaterThan(0);
    });

    test('should match the structure: [Word][Number][SpecialChar]', () => {
        for (let i: number = 0; i < 100; i++) {
            const password: string = generatePassword();
            const regex: RegExp = /^[A-Za-zäöüÄÖÜ]{6,}\d[+\-*\/%&!?@$#]$/;
            expect(password).toMatch(regex);
        }
    });

    test('should include a word with at least 6 characters', () => {
        const password: string = generatePassword();
        const wordMatch: RegExpMatchArray | null = password.match(/^([A-Za-zäöüÄÖÜ]{6,})/);
        expect(wordMatch).not.toBeNull();
        expect(wordMatch![0].length).toBeGreaterThanOrEqual(6);
    });

    it('should generate a password that has at least 8 characters', () => {
        const password: string = generatePassword();

        expect(password.length).toBeGreaterThanOrEqual(8);
    });

    it.each([
        { name: 'numbers', regex: /[0123456789]/ },
        { name: 'symbols', regex: /[+\-*/%&!?@$#]/ },
    ])('Should contain $name', ({ regex }: { regex: RegExp }) => {
        const password: string = generatePassword();

        expect(password).toEqual(expect.stringMatching(regex));
    });
});
