import { BaseEvent } from './base-event.js';

import { type Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { RollenArt } from '../../modules/rolle/domain/rolle.enums.js';

export class PersonenkontextCreatedMigrationEvent extends BaseEvent {
    public constructor(
        public readonly createdKontext: Personenkontext<true>,
        public readonly rollenArt: RollenArt, //Will pe passed from outside due to performance reason (must be anyway retrieved in controller)
        public readonly email?: string,
    ) {
        super();
    }
}
