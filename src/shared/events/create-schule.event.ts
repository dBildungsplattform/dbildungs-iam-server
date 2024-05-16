import { BaseEvent } from './base-event.js';
import { CreatedOrganisationDto } from '../../modules/organisation/api/created-organisation.dto.js';

export class CreateSchuleEvent extends BaseEvent {
    public constructor(public readonly organisation: CreatedOrganisationDto) {
        super();
    }
}
