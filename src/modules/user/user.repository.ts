import { Injectable } from '@nestjs/common';
import { KeycloakUserService, UserDo } from '../keycloak-administration/index.js';
import { DomainError, EntityNotFoundError } from '../../shared/error/index.js';

@Injectable()
export class UserRepository {
    public constructor(private kcUserService: KeycloakUserService) {}

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

    public async getNextAvailableUsername(calculatedUsername: string): Promise<string> {
        if (!(await this.usernameExists(calculatedUsername))) {
            return calculatedUsername;
        }
        let counter: number = 1;
        while (await this.usernameExists(calculatedUsername + counter)) {
            counter = counter + 1;
        }
        return calculatedUsername + counter;
    }
}
