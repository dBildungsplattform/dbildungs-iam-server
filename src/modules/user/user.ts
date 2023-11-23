import { faker } from '@faker-js/faker';

type State = {
    pristine: boolean;
    passwordReset: boolean;
};

export class User {
    private state: State;

    private idInternal: string;

    private usernameInternal: string;

    private passwordInternal: string;

    public constructor(id: string, username: string, password: string) {
        this.idInternal = id;
        this.usernameInternal = username;
        this.passwordInternal = password;
        this.state = { pristine: true, passwordReset: false };
    }

    public get id(): string {
        return this.idInternal;
    }

    public get username(): string {
        return this.usernameInternal;
    }

    public get password(): string {
        return this.passwordInternal;
    }

    public get needsSaving(): boolean {
        return this.state.passwordReset;
    }

    public resetPassword(): void {
        this.passwordInternal = faker.string.alphanumeric({
            length: { min: 10, max: 10 },
            casing: 'mixed',
        }) as string;
        this.state.passwordReset = true;
    }
}
