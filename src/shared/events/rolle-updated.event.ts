import { BaseEvent } from './base-event.js';
import { RolleID } from '../types/index.js';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from '../../modules/rolle/domain/rolle.enums.js';

export class RolleUpdatedEvent extends BaseEvent {
    public constructor(
        public readonly rolleId: RolleID,
        public readonly rollenart: RollenArt,
        public readonly merkmale: RollenMerkmal[],
        public readonly systemrechte: RollenSystemRecht[],
        public readonly serviceProviderIds: string[],
    ) {
        super();
    }
}
