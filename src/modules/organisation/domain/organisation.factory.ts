import { Injectable } from '@nestjs/common';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { OrganisationUpdate } from './organisation-update.js';
import { EventService } from '../../../core/eventbus/services/event.service.js';

@Injectable()
export class OrganisationFactory {
    public constructor(
        private readonly eventService: EventService,
        private readonly organisationRepo: OrganisationRepo,
    ) {}

    public createNewOrganisationUpdate(organisationId: string): OrganisationUpdate {
        return OrganisationUpdate.createNew(this.eventService, this.organisationRepo, organisationId);
    }
}
