import { Injectable } from '@nestjs/common';
import { KeycloakUserService, UserDo } from '../../keycloak-administration/index.js';
import {
    DomainError,
    EntityNotFoundError,
    InvalidNameError,
    InvalidCharacterSetError,
    InvalidAttributeLengthError,
} from '../../../shared/error/index.js';

// Regex to validate DIN-19379A for a string
// Decoded: /^( |'|[,-\.]|[A-Z]|[`-z]|~|¨|´|·|[À-Ö]|[Ø-ö]|[ø-ž]|[Ƈ-ƈ]|Ə|Ɨ|[Ơ-ơ]|[Ư-ư]|Ʒ|[Ǎ-ǜ]|[Ǟ-ǟ]|[Ǣ-ǰ]|[Ǵ-ǵ]|[Ǹ-ǿ]|[Ȓ-ȓ]|[Ș-ț]|[Ȟ-ȟ]|[ȧ-ȳ]|ə|ɨ|ʒ|[ʹ-ʺ]|[ʾ-ʿ]|ˈ|ˌ|[Ḃ-ḃ]|[Ḇ-ḇ]|[Ḋ-ḑ]|ḗ|[Ḝ-ḫ]|[ḯ-ḷ]|[Ḻ-ḻ]|[Ṁ-ṉ]|[Ṓ-ṛ]|[Ṟ-ṣ]|[Ṫ-ṯ]|[Ẁ-ẇ]|[Ẍ-ẗ]|ẞ|[Ạ-ỹ]|’|‡|A̋|C[̣̦̀̄̆̈̕]|D̂|F[̀̄]|G̀|H[̦̱̄]|J[́̌]|K[̛̦̀̂̄̇̕]|L[̥̦̂]|M[̀̂̆̐]|N[̦̂̄̆]|P[̣̀̄̕]|R[̥̆]|S[̱̀̄]|T[̛̀̄̈̕]|U̇|Z[̧̀̄̆̈]|a̋|c[̣̦̀̄̆̈̕]|d̂|f[̀̄]|g̀|h[̦̄]|j́|k[̛̦̀̂̄̇̕]|l[̥̦̂]|m[̀̂̆̐]|n[̦̂̄̆]|p[̣̀̄̕]|r[̥̆]|s[̱̀̄]|t[̛̀̄̕]|u̇|z[̧̀̄̆̈]|Ç̆|Û̄|ç̆|û̄|ÿ́|Č[̣̕]|č[̣̕]|ē̍|Ī́|ī́|ō̍|Ž[̧̦]|ž[̧̦]|Ḳ̄|ḳ̄|Ṣ̄|ṣ̄|Ṭ̄|ṭ̄|Ạ̈|ạ̈|Ọ̈|ọ̈|Ụ[̄̈]|C̨̆|K͟H|K͟h|L̥̄|R̥̄|S̛̄|c̨̆|k͟h|l̥̄|r̥̄|s̛̄)*$/
const DIN_19379A: RegExp =
    /^(\u0020|\u0027|[\u002C-\u002E]|[\u0041-\u005A]|[\u0060-\u007A]|\u007E|\u00A8|\u00B4|\u00B7|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u017E]|[\u0187-\u0188]|\u018F|\u0197|[\u01A0-\u01A1]|[\u01AF-\u01B0]|\u01B7|[\u01CD-\u01DC]|[\u01DE-\u01DF]|[\u01E2-\u01F0]|[\u01F4-\u01F5]|[\u01F8-\u01FF]|[\u0212-\u0213]|[\u0218-\u021B]|[\u021E-\u021F]|[\u0227-\u0233]|\u0259|\u0268|\u0292|[\u02B9-\u02BA]|[\u02BE-\u02BF]|\u02C8|\u02CC|[\u1E02-\u1E03]|[\u1E06-\u1E07]|[\u1E0A-\u1E11]|\u1E17|[\u1E1C-\u1E2B]|[\u1E2F-\u1E37]|[\u1E3A-\u1E3B]|[\u1E40-\u1E49]|[\u1E52-\u1E5B]|[\u1E5E-\u1E63]|[\u1E6A-\u1E6F]|[\u1E80-\u1E87]|[\u1E8C-\u1E97]|\u1E9E|[\u1EA0-\u1EF9]|\u2019|\u2021|\u0041\u030B|\u0043[\u0300\u0304\u0306\u0308\u0315\u0323\u0326]|\u0044\u0302|\u0046[\u0300\u0304]|\u0047\u0300|\u0048[\u0304\u0326\u0331]|\u004A[\u0301\u030C]|\u004B[\u0300\u0302\u0304\u0307\u0315\u031B\u0326]|\u004C[\u0302\u0325\u0326]|\u004D[\u0300\u0302\u0306\u0310]|\u004E[\u0302\u0304\u0306\u0326]|\u0050[\u0300\u0304\u0315\u0323]|\u0052[\u0306\u0325]|\u0053[\u0300\u0304\u0331]|\u0054[\u0300\u0304\u0308\u0315\u031B]|\u0055\u0307|\u005A[\u0300\u0304\u0306\u0308\u0327]|\u0061\u030B|\u0063[\u0300\u0304\u0306\u0308\u0315\u0323\u0326]|\u0064\u0302|\u0066[\u0300\u0304]|\u0067\u0300|\u0068[\u0304\u0326]|\u006A\u0301|\u006B[\u0300\u0302\u0304\u0307\u0315\u031B\u0326]|\u006C[\u0302\u0325\u0326]|\u006D[\u0300\u0302\u0306\u0310]|\u006E[\u0302\u0304\u0306\u0326]|\u0070[\u0300\u0304\u0315\u0323]|\u0072[\u0306\u0325]|\u0073[\u0300\u0304\u0331]|\u0074[\u0300\u0304\u0315\u031B]|\u0075\u0307|\u007A[\u0300\u0304\u0306\u0308\u0327]|\u00C7\u0306|\u00DB\u0304|\u00E7\u0306|\u00FB\u0304|\u00FF\u0301|\u010C[\u0315\u0323]|\u010D[\u0315\u0323]|\u0113\u030D|\u012A\u0301|\u012B\u0301|\u014D\u030D|\u017D[\u0326\u0327]|\u017E[\u0326\u0327]|\u1E32\u0304|\u1E33\u0304|\u1E62\u0304|\u1E63\u0304|\u1E6C\u0304|\u1E6D\u0304|\u1EA0\u0308|\u1EA1\u0308|\u1ECC\u0308|\u1ECD\u0308|\u1EE4[\u0304\u0308]|\u0043\u0328\u0306|\u004B\u035F\u0048|\u004B\u035F\u0068|\u004C\u0325\u0304|\u0052\u0325\u0304|\u0053\u031B\u0304|\u0063\u0328\u0306|\u006B\u035F\u0068|\u006C\u0325\u0304|\u0072\u0325\u0304|\u0073\u031B\u0304)*$/;

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
        if (!DIN_19379A.test(firstname.normalize('NFC'))) {
            return {
                ok: false,
                error: new InvalidCharacterSetError('name.vorname', 'DIN-91379A'),
            };
        }

        if (!DIN_19379A.test(lastname.normalize('NFC'))) {
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

        return {
            ok: true,
            value: await this.getNextAvailableUsername(calculatedUsername),
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
