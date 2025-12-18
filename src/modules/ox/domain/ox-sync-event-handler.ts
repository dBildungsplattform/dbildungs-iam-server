import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { KafkaLdapSyncCompletedEvent } from '../../../shared/events/ldap/kafka-ldap-sync-completed.event.js';
import { LdapSyncCompletedEvent } from '../../../shared/events/ldap/ldap-sync-completed.event.js';
import { OrganisationID, PersonID, PersonUsername, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { PersonEmailIdentifier, PersonIdentifier } from '../../../core/logging/person-identifier.js';
import { Person } from '../../person/domain/person.js';
import { EmailAddress, EmailAddressStatus } from '../../email/domain/email-address.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ChangeUserAction } from '../actions/user/change-user.action.js';
import { generateOxUserChangedEvent, OxEventService, OxUserChangedEventCreator } from './ox-event.service.js';
import { OxService } from './ox.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { OXGroupID, OXUserID } from '../../../shared/types/ox-ids.types.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { uniq } from 'lodash-es';
import { Organisation } from '../../organisation/domain/organisation.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OxSyncError } from '../error/ox-sync.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailRepo } from '../../email/persistence/email.repo.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { Injectable } from '@nestjs/common';
import { AddMemberToGroupAction, AddMemberToGroupResponse } from '../actions/group/add-member-to-group.action.js';
import { OxMemberAlreadyInGroupError } from '../error/ox-member-already-in-group.error.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { EmailResolverService } from '../../email-microservice/domain/email-resolver.service.js';

@Injectable()
export class OxSyncEventHandler {
    public ENABLED: boolean;

    public constructor(
        protected readonly logger: ClassLogger,
        private readonly emailResolverService: EmailResolverService,
        protected readonly oxService: OxService,
        protected readonly oxEventService: OxEventService,
        protected readonly emailRepo: EmailRepo,
        protected readonly personRepository: PersonRepository,
        protected readonly eventService: EventRoutingLegacyKafkaService,
        protected configService: ConfigService<ServerConfig>,

        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');
        this.ENABLED = oxConfig.ENABLED;
    }

    @KafkaEventHandler(KafkaLdapSyncCompletedEvent)
    @EventHandler(LdapSyncCompletedEvent)
    @EnsureRequestContext()
    public async ldapSyncCompletedEventHandler(event: LdapSyncCompletedEvent): Promise<void> {
        this.logger.info(`[EventID: ${event.eventID}] Received LdapSyncCompletedEvent, personId:${event.personId}`);

        if (this.emailResolverService.shouldUseEmailMicroservice()) {
            this.logger.info(`Ignoring Event for personId:${event.personId} because email microservice is enabled`);
            return;
        }

        this.logger.debug(`Handle LdapSyncCompletedEvent in old way`);

        await this.sync(event.personId, event.username);
    }

    private async getPerson(personId: PersonID, username: PersonUsername): Promise<PersonEmailIdentifier | undefined> {
        const personIdentifier: PersonIdentifier = {
            personId: personId,
            username: username,
        };
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            this.logger.errorPersonalized(`Person not found`, personIdentifier);
            return undefined;
        }
        if (!person.username) {
            this.logger.errorPersonalized(
                `Person has no username: Cannot Change Email-Address In OX`,
                personIdentifier,
            );
            return undefined;
        }
        if (!person.oxUserId) {
            this.logger.errorPersonalized(`Person has no OxUserId`, personIdentifier);
            return undefined;
        }

        return {
            personId: personId,
            username: username,
            oxUserId: person.oxUserId,
            oxUserName: person.username,
            person: person,
        };
    }

    public async sync(personId: PersonID, username: PersonUsername): Promise<void> {
        await this.changeOxUser(personId, username, generateOxUserChangedEvent);
        await this.changeUsersGroups(personId, username);
    }

    private async getOrganisationKennungen(
        personId: PersonID,
        username: PersonUsername,
    ): Promise<string[] | OxSyncError> {
        // Get all PKs
        const kontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(personId);

        // Find all rollen and organisations
        const rollenIDs: RolleID[] = uniq(kontexte.map((pk: Personenkontext<true>) => pk.rolleId));
        const organisationIDs: OrganisationID[] = uniq(kontexte.map((pk: Personenkontext<true>) => pk.organisationId));
        const [rollen, organisations]: [Map<RolleID, Rolle<true>>, Map<OrganisationID, Organisation<true>>] =
            await Promise.all([
                this.rolleRepo.findByIds(rollenIDs),
                this.organisationRepository.findByIds(organisationIDs),
            ]);

        // Delete all rollen from map which are NOT LEHR
        for (const [rolleId, rolle] of rollen.entries()) {
            if (rolle.rollenart !== RollenArt.LEHR) {
                rollen.delete(rolleId);
            }
        }

        // Delete all organisations from map which are NOT typ SCHULE
        for (const [orgaId, orga] of organisations.entries()) {
            if (orga.typ !== OrganisationsTyp.SCHULE) {
                organisations.delete(orgaId);
            }
        }

        // Filter PKs for the remaining rollen with rollenArt LEHR and the remaining organisations with typ SCHULE
        const pksWithRollenArtLehrAndOrganisationSchule: Personenkontext<true>[] = kontexte.filter(
            (pk: Personenkontext<true>) => rollen.has(pk.rolleId) && organisations.has(pk.organisationId),
        );

        const schulenDstNrList: string[] = [];
        let schule: Organisation<true> | undefined;
        for (const pk of pksWithRollenArtLehrAndOrganisationSchule) {
            schule = organisations.get(pk.organisationId);
            if (!schule) {
                const errMsg: string = `Could not find organisation, orgaId:${pk.organisationId}, pkId:${pk.id}`;
                this.logger.error(errMsg);
                return new OxSyncError(errMsg);
            }
            if (!schule.kennung) {
                const errMsg: string = `Required kennung is missing on organisation, orgaId:${pk.organisationId}, pkId:${pk.id}`;
                this.logger.error(errMsg);
                return new OxSyncError(errMsg);
            }
            schulenDstNrList.push(schule.kennung);
        }
        this.logger.info(
            `Found orgaKennungen:${JSON.stringify(schulenDstNrList)}, for personId:${personId}, username:${username}`,
        );

        return schulenDstNrList;
    }

    private async changeOxUser(
        personId: PersonID,
        username: PersonUsername,
        eventCreator: OxUserChangedEventCreator,
    ): Promise<void> {
        const personIdentifier: PersonIdentifier = {
            personId: personId,
            username: username,
        };
        const personEmailIdentifier: PersonEmailIdentifier | undefined = await this.getPerson(personId, username);
        if (!personEmailIdentifier) {
            return this.logger.errorPersonalized('Fetching Person during OxSync failed', personIdentifier);
        }

        const mostRecentRequestedOrEnabledEA: Option<EmailAddress<true>> =
            await this.oxEventService.getMostRecentEnabledOrRequestedEmailAddress(personId);
        if (!mostRecentRequestedOrEnabledEA) {
            return;
        } //logging is done in getMostRecentRequestedEmailAddress
        const currentEmailAddressString: string = mostRecentRequestedOrEnabledEA.address;

        const disabledEmailAddresses: EmailAddress<true>[] = await this.emailRepo.findByPersonSortedByUpdatedAtDesc(
            personId,
            EmailAddressStatus.DISABLED,
        );
        const aliases: string[] = disabledEmailAddresses.map((ea: EmailAddress<true>) => ea.address);
        aliases.push(currentEmailAddressString);

        this.logger.info(
            `Current aliases to be written:${JSON.stringify(aliases)}, personId:${personId}, username:${username}`,
        );

        const action: ChangeUserAction = this.oxEventService.createChangeUserAction(
            personEmailIdentifier.oxUserId,
            username,
            aliases,
            personEmailIdentifier.person.vorname,
            personEmailIdentifier.person.familienname,
            personEmailIdentifier.person.username, //IS EXPLICITLY NOT SET to vorname+familienname
            currentEmailAddressString,
            currentEmailAddressString,
        );

        const result: Result<void, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            mostRecentRequestedOrEnabledEA.failed();
            await this.emailRepo.save(mostRecentRequestedOrEnabledEA);

            return this.logger.errorPersonalized(
                `Could not rewrite OxUser for oxUserId:${personEmailIdentifier.oxUserId}, error:${result.error.message}`,
                personIdentifier,
            );
        }

        this.logger.infoPersonalized(
            `Rewritten OxUser successfully, oxUserId:${personEmailIdentifier.oxUserId}, oxUsername:${username}, new email-address:${currentEmailAddressString}`,
            personIdentifier,
        );

        this.oxEventService.publishOxUserChangedEvent2(
            eventCreator,
            personId,
            username,
            personEmailIdentifier.oxUserId,
            personEmailIdentifier.oxUserName,
            currentEmailAddressString,
        );
    }

    private async addOxUserToGroup(
        oxUserId: OXUserID,
        schuleDstrNr: string,
        personIdentifier: PersonIdentifier,
    ): Promise<void> {
        // Fetch or create the relevant OX group based on orgaKennung (group identifier)
        const oxGroupIdResult: Result<OXGroupID> = await this.oxEventService.getExistingOxGroupByNameOrCreateOxGroup(
            OxEventService.LEHRER_OX_GROUP_NAME_PREFIX + schuleDstrNr,
            OxEventService.LEHRER_OX_GROUP_DISPLAY_NAME_PREFIX + schuleDstrNr,
        );

        if (!oxGroupIdResult.ok) {
            return this.logger.errorPersonalized(
                `Could not get OxGroup for schulenDstNr:${schuleDstrNr}`,
                personIdentifier,
            );
        }

        const addMemberToGroupAction: AddMemberToGroupAction = this.oxEventService.createAddMemberToGroupAction(
            oxGroupIdResult.value,
            oxUserId,
        );

        const result: Result<AddMemberToGroupResponse, DomainError> = await this.oxService.send(addMemberToGroupAction);
        if (!result.ok && !(result.error instanceof OxMemberAlreadyInGroupError)) {
            this.logger.errorPersonalized(
                `Could not add oxUser to oxGroup, schulenDstNr:${schuleDstrNr}`,
                personIdentifier,
            );
        }
        this.logger.info(
            `Successfully added oxUser to oxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupIdResult.value}`,
        );
    }

    private async changeUsersGroups(personId: PersonID, username: PersonUsername): Promise<void> {
        const personIdentifier: PersonIdentifier = {
            personId: personId,
            username: username,
        };
        const personEmailIdentifier: PersonEmailIdentifier | undefined = await this.getPerson(personId, username);
        if (!personEmailIdentifier) {
            return this.logger.errorPersonalized('Fetching Person during OxSync failed', personIdentifier);
        }

        const oxUserId: OXUserID = personEmailIdentifier.oxUserId;

        await this.oxEventService.removeOxUserFromAllItsOxGroups(oxUserId, personIdentifier);

        const schulenDstNrList: string[] | OxSyncError = await this.getOrganisationKennungen(personId, username);
        if (schulenDstNrList instanceof OxSyncError) {
            return this.logger.errorPersonalized('Could not get organisations during OxSync', personIdentifier);
        }

        const promises: Promise<void>[] = schulenDstNrList.map((schulenDstNr: string) =>
            this.addOxUserToGroup(oxUserId, schulenDstNr, personIdentifier),
        );
        await Promise.allSettled(promises);
    }
}
