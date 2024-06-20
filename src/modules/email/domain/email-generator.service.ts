import { Injectable } from '@nestjs/common';
import {
    DomainError,
    InvalidNameError,
    InvalidCharacterSetError,
    InvalidAttributeLengthError,
} from '../../../shared/error/index.js';
import { isDIN91379A, toDIN91379SearchForm } from '../../../shared/util/din-91379-validation.js';
import { EmailServiceRepo } from '../persistence/email-service.repo.js';

@Injectable()
export class EmailGeneratorService {
    public constructor(private emailServiceRepo: EmailServiceRepo) {}

    public async generateAddress(firstname: string, lastname: string): Promise<Result<string, DomainError>> {
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

        const nextAddressName: string = await this.getNextAvailableAddress(calculatedAddress);

        return {
            ok: true,
            value: nextAddressName + '@schule-sh.de',
        };
    }

    private cleanString(name: string): string {
        const lowerCaseSearchForm: string = toDIN91379SearchForm(name).toLowerCase();

        // Remove all other characters that are not a-z
        const removedDiacritics: string = lowerCaseSearchForm.replace(/[^a-z]/g, '');

        return removedDiacritics;
    }

    private async getNextAvailableAddress(calculatedAddress: string): Promise<string> {
        if (!(await this.emailServiceRepo.exists(calculatedAddress))) {
            return calculatedAddress;
        }
        let counter: number = 1;
        while (await this.emailServiceRepo.exists(calculatedAddress + counter)) {
            counter = counter + 1;
        }
        return calculatedAddress + counter;
    }
}
