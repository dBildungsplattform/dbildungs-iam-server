import { Injectable } from '@nestjs/common';
import { KeycloakUserService, UserDo } from '../../keycloak-administration/index.js';
import {
    DomainError,
    EntityNotFoundError,
    InvalidNameError,
    InvalidCharacterSetError,
    InvalidAttributeLengthError,
} from '../../../shared/error/index.js';
import { isDIN91379A } from '../../../shared/util/din-91379-validation.js';

// Specific replacements for german, danish and french
const NORMALIZATION_LIST: { pattern: RegExp; base: string }[] = [
    { base: 'a', pattern: /[\u00E0\u00E2]/g }, // [à,â] -> a
    { base: 'c', pattern: /\u00E7/g }, // [ç] -> c
    { base: 'e', pattern: /[\u00E8\u00E9\u00EA\u00EB]/g }, // [è,é,ê,ë] -> e
    { base: 'i', pattern: /[\u00EE\u00EF]/g }, // [î,ï] -> i
    { base: 'o', pattern: /\u00F4/g }, // [ô] -> o
    { base: 'u', pattern: /[\u00F9\u00Fb]/g }, // [ùû] -> u
    { base: 'y', pattern: /\u00FF/g }, // [ÿ] -> y
    { base: 'aa', pattern: /\u00E5/g }, // [å] -> aa
    { base: 'ae', pattern: /[\u00E4\u00E6]/g }, // [ä,æ] -> ae
    { base: 'oe', pattern: /[\u00F6\u00F8\u0153]/g }, // [ö,ø,œ] -> oe
    { base: 'ue', pattern: /\u00FC/g }, // [ü] -> ue
    { base: 'ss', pattern: /\u00DF/g }, // [ß] -> ss
];

@Injectable()
export class UsernameGeneratorService {
    public constructor(private kcUserService: KeycloakUserService) {}

    public async generateUsername(firstname: string, lastname: string): Promise<Result<string, DomainError>> {
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

        const calculatedUsername: string = cleanedFirstname[0] + cleanedLastname;

        const nextAvailableUsername: string = await this.getNextAvailableUsername(calculatedUsername);

        return {
            ok: true,
            value: nextAvailableUsername,
        };
    }

    private cleanString(name: string): string {
        const lowerCaseInput: string = name.toLowerCase();

        let replacedString: string = lowerCaseInput;
        for (const replacement of NORMALIZATION_LIST) {
            replacedString = replacedString.replace(replacement.pattern, replacement.base);
        }

        // Normalize into NFKD form to split base characters and diacritics
        const normalizedString: string = replacedString.normalize('NFKD');

        // Remove all characters except a-z
        const removedDiacritics: string = normalizedString.replace(/[^a-z]/g, '');

        return removedDiacritics;
    }

    private async getNextAvailableUsername(calculatedUsername: string): Promise<string> {
        if (!(await this.usernameExists(calculatedUsername))) {
            return calculatedUsername;
        }
        let counter: number = 1;
        while (await this.usernameExists(calculatedUsername + counter)) {
            counter = counter + 1;
        }
        return calculatedUsername + counter;
    }

    public async usernameExists(username: string): Promise<boolean> {
        const searchResult: Result<UserDo<true>, DomainError> | { ok: false; error: DomainError } =
            await this.kcUserService.findOne({ username: username });
        if (searchResult.ok) {
            return true;
        } else {
            if (searchResult.error instanceof EntityNotFoundError) {
                return false;
            }
        }
        throw searchResult.error;
    }
}
