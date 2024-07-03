import { PersonID } from '../../../shared/types/index.js';

export class EmailAddress<WasPersisted extends boolean> {
    public constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public personId: PersonID,
        public address: string,
        public enabled: boolean,
    ) {}
}
