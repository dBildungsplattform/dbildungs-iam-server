import { faker } from '@faker-js/faker';
import { KeycloakUserService, UserDo } from '../keycloak-administration/index.js';
import { DomainError } from '../../shared/error/index.js';

type State = {
    pristine: boolean;
    passwordReset: boolean;
};

export class User {
    private state: State;

    private idInternal: string;

    private usernameInternal: string;

    private newPasswordInternal: string;

    public constructor(id: string, username: string, password: string) {
        this.idInternal = id;
        this.usernameInternal = username;
        this.newPasswordInternal = password;
        this.state = { pristine: this.idInternal.length == 0, passwordReset: false };
    }

    public get id(): string {
        return this.idInternal;
    }

    private set id(id: string) {
        this.idInternal = id;
    }

    public get username(): string {
        return this.usernameInternal;
    }

    public get newPassword(): string {
        return this.newPasswordInternal;
    }

    public get needsSaving(): boolean {
        return this.state.passwordReset;
    }

    public get new(): boolean {
        return this.state.pristine;
    }

    public resetPassword(): void {
        this.newPasswordInternal = faker.string.alphanumeric({
            length: { min: 10, max: 10 },
            casing: 'mixed',
        });
        this.state.passwordReset = true;
    }

    public async save(kcUserService: KeycloakUserService): Promise<void> {
        if (!(this.needsSaving || this.new)) {
            return;
        }

        if (this.new) {
            const userDo: UserDo<false> = {
                username: this.username,
            } as UserDo<false>;
            const creationResult: Result<string, DomainError> = await kcUserService.create(userDo);
            if (!creationResult.ok) {
                throw creationResult.error;
            }
            this.id = creationResult.value;
        }
        const setPasswordResult: Result<string, DomainError> = await kcUserService.resetPassword(
            this.id,
            this.newPassword,
        );
        if (!setPasswordResult.ok) {
            if (this.state.pristine) {
                // This means, we couldn't set even the initial password
                await kcUserService.delete(this.id);
                this.id = '';
            }
            throw setPasswordResult.error;
        }
    }
}
