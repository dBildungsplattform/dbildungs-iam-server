import { faker } from '@faker-js/faker';

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
}
