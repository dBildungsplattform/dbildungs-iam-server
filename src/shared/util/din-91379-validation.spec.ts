import { toDIN91379SearchForm } from './din-91379-validation.js';

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
});
