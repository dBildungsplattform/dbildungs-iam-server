import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { KafkaLdapSyncCompletedEvent } from '../../../shared/events/ldap/kafka-ldap-sync-completed.event.js';
import { LdapSyncCompletedEvent } from '../../../shared/events/ldap/ldap-sync-completed.event.js';
import { OrganisationID, PersonID, PersonReferrer, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { PersonIdentifier } from '../../../core/logging/person-identifier.js';
import { Person } from '../../person/domain/person.js';
import { EmailAddress, EmailAddressStatus } from '../../email/domain/email-address.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ChangeUserAction, ChangeUserParams } from '../actions/user/change-user.action.js';
import { OxUserChangedEvent } from '../../../shared/events/ox/ox-user-changed.event.js';
import { KafkaOxUserChangedEvent } from '../../../shared/events/ox/kafka-ox-user-changed.event.js';
import { AbstractOxEventHandler } from './abstract-ox-event-handler.js';
import { OxService } from './ox.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { OXContextID, OXContextName, OXUserID, OXUserName } from '../../../shared/types/ox-ids.types.js';
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

//Duplicate from OxEventHandler, to be refactored...
export type OxUserChangedEventCreator = (
    personId: PersonID,
    username: PersonReferrer,
    oxUserId: OXUserID,
    oxUserName: OXUserName,
    oxContextId: OXContextID,
    oxContextName: OXContextName,
    emailAddress: string,
) => [OxUserChangedEvent, KafkaOxUserChangedEvent];

const generateOxUserChangedEvent: OxUserChangedEventCreator = (
    personId: PersonID,
    username: PersonReferrer,
    oxUserId: OXUserID,
    oxUserName: OXUserName,
    oxContextId: OXContextID,
    oxContextName: OXContextName,
    emailAddress: string,
) => {
    return [
        new OxUserChangedEvent(
            personId,
            username,
            oxUserId,
            oxUserName, //strictEquals the new OxUsername
            oxContextId,
            oxContextName,
            emailAddress,
        ),
        new KafkaOxUserChangedEvent(
            personId,
            username,
            oxUserId,
            oxUserName, //strictEquals the new OxUsername
            oxContextId,
            oxContextName,
            emailAddress,
        ),
    ];
};

@Injectable()
export class OxSyncEventHandler extends AbstractOxEventHandler {
    public constructor(
        protected override readonly logger: ClassLogger,
        protected override readonly emailRepo: EmailRepo,
        protected override readonly eventService: EventRoutingLegacyKafkaService,
        protected override configService: ConfigService<ServerConfig>,

        private readonly oxService: OxService,
        private readonly personRepository: PersonRepository,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {
        super(logger, emailRepo, eventService, configService);
    }

    @KafkaEventHandler(KafkaLdapSyncCompletedEvent)
    @EventHandler(LdapSyncCompletedEvent)
    @EnsureRequestContext()
    public async ldapSyncCompletedEventHandler(event: LdapSyncCompletedEvent): Promise<void> {
        this.logger.info(`[EventID: ${event.eventID}] Received LdapSyncCompletedEvent, personId:${event.personId}`);

        await this.sync(event.personId, event.username);
    }

    private async sync(personId: PersonID, username: PersonReferrer): Promise<void> {
        await this.changeOxUser(personId, username, generateOxUserChangedEvent);
        await this.changeUsersGroups(personId, username);
    }

    private async getOrganisationKennungen(
        personId: PersonID,
        username: PersonReferrer,
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
        username: PersonReferrer,
        eventCreator: OxUserChangedEventCreator,
    ): Promise<void> {
        const personIdentifier: PersonIdentifier = {
            personId: personId,
            username: username,
        };
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            return this.logger.errorPersonalized(`Person not found`, personIdentifier);
        }
        if (!person.referrer) {
            return this.logger.errorPersonalized(
                `Person has no username: Cannot Change Email-Address In OX`,
                personIdentifier,
            );
        }
        if (!person.oxUserId) {
            return this.logger.errorPersonalized(`Person has no OxUserId`, personIdentifier);
        }

        const mostRecentRequestedOrEnabledEA: Option<EmailAddress<true>> =
            await this.getMostRecentEnabledOrRequestedEmailAddress(personId);
        if (!mostRecentRequestedOrEnabledEA) return; //logging is done in getMostRecentRequestedEmailAddress
        const currentEmailAddressString: string = mostRecentRequestedOrEnabledEA.address;

        const disabledEmailAddresses: EmailAddress<true>[] = await this.emailRepo.findByPersonSortedByUpdatedAtDesc(
            personId,
            EmailAddressStatus.DISABLED,
        );
        const aliases: string[] = disabledEmailAddresses.map((ea: EmailAddress<true>) => ea.address);
        aliases.push(currentEmailAddressString);

        this.logger.info(
            `Current aliases to be written:${JSON.stringify(aliases)}, personId:${personIdentifier.personId}, username:${personIdentifier.username}`,
        );

        const params: ChangeUserParams = {
            contextId: this.contextID,
            contextName: this.contextName,
            userId: person.oxUserId,
            username: person.referrer,
            givenname: person.vorname,
            surname: person.familienname,
            displayname: person.referrer, //IS EXPLICITLY NOT SET to vorname+familienname
            defaultSenderAddress: currentEmailAddressString,
            email1: currentEmailAddressString,
            aliases: aliases,
            primaryEmail: currentEmailAddressString,
            imapLogin: currentEmailAddressString,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: ChangeUserAction = new ChangeUserAction(params);

        const result: Result<void, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            mostRecentRequestedOrEnabledEA.failed();
            await this.emailRepo.save(mostRecentRequestedOrEnabledEA);

            return this.logger.errorPersonalized(
                `Could not rewrite OxUser for oxUserId:${person.oxUserId}, error:${result.error.message}`,
                personIdentifier,
            );
        }

        this.logger.infoPersonalized(
            `Rewritten OxUser successfully, oxUserId:${person.oxUserId}, oxUsername:${person.referrer}, new email-address:${currentEmailAddressString}`,
            personIdentifier,
        );

        const event: [OxUserChangedEvent, KafkaOxUserChangedEvent] = eventCreator(
            personId,
            person.referrer,
            person.oxUserId,
            person.referrer, //strictEquals the new OxUsername
            this.contextID,
            this.contextName,
            currentEmailAddressString,
        );

        this.eventService.publish(...event);
    }

    private async changeUsersGroups(personId: PersonID, username: PersonReferrer): Promise<void> {
        //const schulenDstNrList: string[] = await this.getOrganisationKennungen(personId, username);
        await this.getOrganisationKennungen(personId, username);
    }
}
