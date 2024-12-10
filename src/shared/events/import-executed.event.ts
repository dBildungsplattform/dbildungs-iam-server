import { PersonPermissions } from '../../modules/authentication/domain/person-permissions.js';
import { BaseEvent } from './base-event.js';

export class ImportExecutedEvent extends BaseEvent {
    public constructor(
        public readonly importVorgangId: string,
        public readonly organisationId: string,
        public readonly rolleId: string,
        public readonly permissions: PersonPermissions,
    ) {
        super();
    }
}
