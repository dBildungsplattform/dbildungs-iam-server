import {
    InvalidNameError,
    InvalidCharacterSetError,
    InvalidAttributeLengthError,
} from '../../../shared/error/index.js';
import { isDIN91379A, toDIN91379SearchForm } from '../../../shared/util/din-91379-validation.js';
import { EmailRepo } from '../persistence/email.repo.js';

export class EmailGenerator {
    private static EMAIL_SUFFIX: string = '@schule-sh.de';

    public constructor(private emailRepo: EmailRepo) {}

    public isEqual(address: string, firstname: string, lastname: string): boolean {
        const createAddress: Result<string> = this.calculateAddress(firstname, lastname);

        if (!createAddress.ok) return false;

        return address === createAddress.value + EmailGenerator.EMAIL_SUFFIX;
    }

    public calculateAddress(firstname: string, lastname: string): Result<string> {
        // Check for minimum length
        if (firstname.length < 2) {
            return { ok: false, error: new InvalidAttributeLengthError('name.vorname') };
        }

        if (lastname.length < 2) {
            return { ok: false, error: new InvalidAttributeLengthError('name.familienname') };
        }

        // Check character set
        if (!isDIN91379A(firstname)) {
            return {
                ok: false,
                error: new InvalidCharacterSetError('name.vorname', 'DIN-91379A'),
            };
        }

        if (!isDIN91379A(lastname)) {
            return {
                ok: false,
                error: new InvalidCharacterSetError('name.familienname', 'DIN-91379A'),
            };
        }

        // Clean names
        const cleanedFirstname: string = this.cleanString(firstname);
        const cleanedLastname: string = this.cleanString(lastname);

        // Check resulting cleaned names
        if (cleanedFirstname.length === 0 || cleanedLastname.length === 0) {
            return { ok: false, error: new InvalidNameError('Could not generate valid username') };
        }

        const calculatedAddress: string = cleanedFirstname + '.' + cleanedLastname;

        // Check resulting address
        if (calculatedAddress.length > 64) {
            return { ok: false, error: new InvalidNameError('Could not generate valid username') };
        }

        return {
            ok: true,
            value: calculatedAddress,
        };
    }

    public async generateAddress(firstname: string, lastname: string): Promise<Result<string>> {
        const createdAddress: Result<string> = this.calculateAddress(firstname, lastname);

        if (!createdAddress.ok) return createdAddress;

        const nextAddressName: string = await this.getNextAvailableAddress(createdAddress.value);

        return {
            ok: true,
            value: nextAddressName + EmailGenerator.EMAIL_SUFFIX,
        };
    }

    private cleanString(name: string): string {
        const lowerCaseSearchForm: string = toDIN91379SearchForm(name).toLowerCase();

        // Remove all other characters that are not a-z
        let lowerCaseStrings: string[] = lowerCaseSearchForm.split('-');
        lowerCaseStrings = lowerCaseStrings.filter((s: string) => s.length > 0);
        const removedDiacritics: string[] = lowerCaseStrings.map((s: string) => s.replace(/[^a-z\-]/g, ''));

        return removedDiacritics.join('-');
    }

    private async getNextAvailableAddress(calculatedAddress: string): Promise<string> {
        if (!(await this.emailRepo.existsEmailAddress(calculatedAddress + EmailGenerator.EMAIL_SUFFIX))) {
            return calculatedAddress;
        }
        let counter: number = 1;
        while (await this.emailRepo.existsEmailAddress(calculatedAddress + counter + EmailGenerator.EMAIL_SUFFIX)) {
            counter = counter + 1;
        }
        return calculatedAddress + counter;
    }
}
