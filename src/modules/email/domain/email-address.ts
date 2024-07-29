import { PersonID } from '../../../shared/types/index.js';

export class EmailAddress<WasPersisted extends boolean> {
    public constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        private addressPersonId: PersonID,
        private addressAddress: string,
        private addressEnabled: boolean,
    ) {}

    public static construct(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        personId: PersonID,
        address: string,
        enabled: boolean,
    ): EmailAddress<true> {
        return new EmailAddress(id, createdAt, updatedAt, personId, address, enabled);
    }

    public static createNew(personId: PersonID, address: string, enabled: boolean): EmailAddress<false> {
        return new EmailAddress(undefined, undefined, undefined, personId, address, enabled);
    }

    public enable(): boolean {
        const oldValue: boolean = this.enabled;
        this.addressEnabled = true;

        return oldValue;
    }

    public disable(): boolean {
        const oldValue: boolean = this.enabled;
        this.addressEnabled = false;

        return oldValue;
    }

    public get enabled(): boolean {
        return this.addressEnabled;
    }

    public get personId(): PersonID {
        return this.addressPersonId;
    }

    public get address(): string {
        return this.addressAddress;
    }

    public get currentAddress(): Option<string> {
        if (!this.enabled) return undefined;

        return this.addressAddress;
    }
}
