import { Injectable } from '@nestjs/common';
import { KeycloakUserService, User } from '../../keycloak-administration/index.js';
import {
    DomainError,
    EntityNotFoundError,
    InvalidNameError,
    InvalidCharacterSetError,
    InvalidAttributeLengthError,
} from '../../../shared/error/index.js';
import { isDIN91379A, toDIN91379SearchForm } from '../../../shared/util/din-91379-validation.js';
import { OxUserBlacklistRepo } from '../persistence/ox-user-blacklist.repo.js';
import { OxUserBlacklistEntry } from './ox-user-blacklist-entry.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';

@Injectable()
export class UsernameGeneratorService {
    public constructor(
        private readonly logger: ClassLogger,
        private kcUserService: KeycloakUserService,
        private oxUserBlacklistRepo: OxUserBlacklistRepo,
    ) {}

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
        const lowerCaseSearchForm: string = toDIN91379SearchForm(name).toLowerCase();

        // Remove all other characters that are not a-z
        const removedDiacritics: string = lowerCaseSearchForm.replace(/[^a-z]/g, '');

        return removedDiacritics;
    }

    private async getNextAvailableUsername(calculatedUsername: string): Promise<string> {
        if (!(await this.usernameExists(calculatedUsername))) {
            return calculatedUsername;
        }
        let counter: number = 1;
        /* eslint-disable no-await-in-loop */
        while (await this.usernameExists(calculatedUsername + counter)) {
            counter = counter + 1;
        }
        this.logger.info(`Next Available Username Is:${calculatedUsername + counter}`);

        return calculatedUsername + counter;
    }

    /**
     * This method can throw errors e.g. if Keycloak search fails.
     * @param username
     * @private
     */
    private async usernameExists(username: string): Promise<boolean> {
        // Check Keycloak
        const searchResult: Result<User<true>, DomainError> = await this.kcUserService.findOne({ username });
        if (searchResult.ok) {
            return true; // Username exists in Keycloak
        } else if (!(searchResult.error instanceof EntityNotFoundError)) {
            throw searchResult.error; // Something else went wrong with Keycloak search
        }

        // Check OX Blacklist for the username. If it exists then return true.
        const oxUser: Option<OxUserBlacklistEntry<true>> = await this.oxUserBlacklistRepo.findByOxUsername(username);

        return !!oxUser;
    }
}
