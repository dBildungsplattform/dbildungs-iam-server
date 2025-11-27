import { Injectable } from '@nestjs/common';
import { InvalidAttributeLengthError } from '../../../../shared/error/invalid-attribute-length.error.js';
import { InvalidCharacterSetError } from '../../../../shared/error/invalid-character-set.error.js';
import { InvalidNameError } from '../../../../shared/error/invalid-name.error.js';
import { isDIN91379A, toDIN91379SearchForm } from '../../../../shared/util/din-91379-validation.js';
import { EmailAddressGenerationAttemptsExceededError } from '../error/email-address-generation-attempts-exceeds.error.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';

@Injectable()
export class EmailAddressGenerator {
    private static MAX_ATTEMPTS_ADDRESS_GENERATION: number = 50;

    public constructor(private emailAddressRepo: EmailAddressRepo) {}

    public isEqual(address: string, firstname: string, lastname: string, emailDomain: string): boolean {
        const createAddress: Result<string> = this.generateAddress(firstname, lastname);

        if (!createAddress.ok) {
            return false;
        }

        return address === createAddress.value + '@' + emailDomain;
    }

    /**
     * Same as isEqual, but ignores trailing digits in the username part of the address
     */
    public isEqualIgnoreCount(address: string, firstname: string, lastname: string, emailDomain: string): boolean {
        const expectedAddress: Result<string> = this.generateAddress(firstname, lastname);

        if (!expectedAddress.ok) {
            // Generation of address failed
            return false;
        }

        const split: string[] = address.split('@');
        if (split.length !== 2) {
            // Input address is invalid
            return false;
        }

        const [actualUsername, actualDomain]: [string, string] = split as [string, string];

        // Domains need to match in order to be equal
        if (actualDomain !== emailDomain) {
            return false;
        }

        // Cut of any expected count
        const [expectedUsername, possibleCount]: [string, string] = [
            actualUsername.substring(0, expectedAddress.value.length),
            actualUsername.substring(expectedAddress.value.length),
        ];

        if (expectedUsername !== expectedAddress.value) {
            return false;
        }

        // The remaining characters should only be digits
        return !!possibleCount.match(/^\d*$/);
    }

    public generateAddress(firstname: string, lastname: string): Result<string> {
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
            return { ok: false, error: new InvalidNameError('Could not generate valid email') };
        }

        const calculatedAddress: string = cleanedFirstname + '.' + cleanedLastname;

        // Check resulting address
        if (calculatedAddress.length > 64) {
            return { ok: false, error: new InvalidNameError('Could not generate valid email') };
        }

        return {
            ok: true,
            value: calculatedAddress,
        };
    }

    public async generateAvailableAddress(
        firstname: string,
        lastname: string,
        emailDomain: string,
    ): Promise<Result<string>> {
        const createdAddress: Result<string> = this.generateAddress(firstname, lastname);

        if (!createdAddress.ok) {
            return createdAddress;
        }

        const nextAvailableAddressResult: Result<string> = await this.getNextAvailableAddress(
            createdAddress.value,
            emailDomain,
        );

        if (!nextAvailableAddressResult.ok) {
            return nextAvailableAddressResult;
        }

        return {
            ok: true,
            value: nextAvailableAddressResult.value + '@' + emailDomain,
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

    private async getNextAvailableAddress(
        calculatedAddress: string,
        emailDomain: string,
        call: number = 0,
    ): Promise<Result<string>> {
        if (call > EmailAddressGenerator.MAX_ATTEMPTS_ADDRESS_GENERATION) {
            return {
                ok: false,
                error: new EmailAddressGenerationAttemptsExceededError(calculatedAddress),
            };
        }
        let counterAsStr: string = '';
        if (call > 0) {
            counterAsStr = '' + call;
        }

        if (!(await this.emailAddressRepo.existsEmailAddress(calculatedAddress + counterAsStr + '@' + emailDomain))) {
            return {
                ok: true,
                value: calculatedAddress + counterAsStr,
            };
        }

        return this.getNextAvailableAddress(calculatedAddress, emailDomain, call + 1);
    }
}
