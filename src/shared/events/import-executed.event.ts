import { BaseEvent } from './base-event.js';

export class ImportExecutedEvent extends BaseEvent {
    public constructor(
        public readonly importVorgangId: string,
        public readonly organisationId: string,
        public readonly rolleId: string,
        // The keycloak user ID of the person doing the import. Used to load permissions in the event handler
        public readonly importerKeycloakId: string,
    ) {
        super();
    }
}
