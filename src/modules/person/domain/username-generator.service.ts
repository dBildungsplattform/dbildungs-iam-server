import { Injectable } from '@nestjs/common';
import { KeycloakUserService, UserDo } from '../../keycloak-administration/index.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';

@Injectable()
export class UsernameGeneratorService {
    public constructor(private kcUserService: KeycloakUserService) {}

    public async generateUsername(firstname: string, lastname: string): Promise<string> {
        if (firstname.length == 0) {
            throw new Error('First name not given');
        }
        if (lastname.length == 0) {
            throw new Error('Last name not given');
        }
        const calculatedUsername: string = this.cleanString(firstname)[0] + this.cleanString(lastname);

        return this.getNextAvailableUsername(calculatedUsername);
    }

    private cleanString(name: string): string {
        const lowerCaseInput: string = name.toLowerCase();

        const normalizedString: string = [...lowerCaseInput]
            .map((s: string) => {
                switch (s) {
                    case 'ä':
                        return 'ae';
                    case 'ö':
                        return 'oe';
                    case 'ü':
                        return 'ue';
                    case 'ß':
                        return 'ss';
                    default:
                        return s;
                }
            })
            .join('')
            .normalize('NFKD');
        return normalizedString.replace(new RegExp('[^\u0061-\u007a]', 'g'), '');
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
