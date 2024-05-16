import {Injectable} from '@nestjs/common';
import {CreateSchuleEvent} from '../../../shared/events/create-schule.event.js';
import {EventHandler} from '../../eventbus/decorators/event-handler.decorator.js';
import {LdapClientService} from './ldap-client.service.js';
import {ClassLogger} from "../../logging/class-logger.js";
import {CreatedOrganisationDto} from "../../../modules/organisation/api/created-organisation.dto";
import {OrganisationsTyp} from "../../../modules/organisation/domain/organisation.enums";

//import {ClassLogger} from "../../logging/class-logger.js";

@Injectable()
export class LdapEventHandler {

    public constructor(
        private readonly logger: ClassLogger,
        private readonly ldapClientService: LdapClientService,
    ) {}

    @EventHandler(CreateSchuleEvent)
    public async asyncEventHandler(event: CreateSchuleEvent): Promise<void> {
        this.logger.info(event.organisation.name);
        if (event.organisation.typ == OrganisationsTyp.SCHULE) {
            this.logger.info(`Call LdapClientService because ${event.organisation.name} type is SCHULE`);
            const creationResult: Result<CreatedOrganisationDto> = await this.ldapClientService.createOrganisation(event.organisation);
            if (!creationResult.ok) {
                this.logger.error(creationResult.error.message);
            }
        }

    }
}
