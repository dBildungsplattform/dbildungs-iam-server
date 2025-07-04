import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { DisabledEmailAddressGeneratedEvent } from '../../../shared/events/email/disabled-email-address-generated.event.js';
import { EmailAddressAlreadyExistsEvent } from '../../../shared/events/email/email-address-already-exists.event.js';
import { EmailAddressChangedEvent } from '../../../shared/events/email/email-address-changed.event.js';
import { EmailAddressDisabledEvent } from '../../../shared/events/email/email-address-disabled.event.js';
import { EmailAddressGeneratedEvent } from '../../../shared/events/email/email-address-generated.event.js';
import { KafkaDisabledEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-disabled-email-address-generated.event.js';
import { KafkaEmailAddressAlreadyExistsEvent } from '../../../shared/events/email/kafka-email-address-already-exists.event.js';
import { KafkaEmailAddressChangedEvent } from '../../../shared/events/email/kafka-email-address-changed.event.js';
import { KafkaEmailAddressDisabledEvent } from '../../../shared/events/email/kafka-email-address-disabled.event.js';
import { KafkaEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-email-address-generated.event.js';
import { KafkaPersonDeletedEvent } from '../../../shared/events/kafka-person-deleted.event.js';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event.js';
import { KafkaLdapPersonEntryRenamedEvent } from '../../../shared/events/ldap/kafka-ldap-person-entry-renamed.event.js';
import { LdapPersonEntryRenamedEvent } from '../../../shared/events/ldap/ldap-person-entry-renamed.event.js';
import { DisabledOxUserChangedEvent } from '../../../shared/events/ox/disabled-ox-user-changed.event.js';
import { KafkaDisabledOxUserChangedEvent } from '../../../shared/events/ox/kafka-disabled-ox-user-changed.event.js';
import { KafkaOxMetadataInKeycloakChangedEvent } from '../../../shared/events/ox/kafka-ox-metadata-in-keycloak-changed.event.js';
import { OxMetadataInKeycloakChangedEvent } from '../../../shared/events/ox/ox-metadata-in-keycloak-changed.event.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { PersonenkontextEventKontextData } from '../../../shared/events/personenkontext-event.types.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { RolleUpdatedEvent } from '../../../shared/events/rolle-updated.event.js';
import { OrganisationID, OrganisationKennung, PersonID, PersonReferrer } from '../../../shared/types/index.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonDomainError } from '../../person/domain/person-domain.error.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderKategorie } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { EmailAddressEntity } from '../persistence/email-address.entity.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { EmailAddress, EmailAddressStatus } from './email-address.js';
import { EmailFactory } from './email.factory.js';

type RolleWithPK = {
    rolle: Rolle<true>;
    personenkontext: Personenkontext<true>;
};

@Injectable()
export class EmailEventHandler {
    public OX_ENABLED: boolean;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailFactory: EmailFactory,
        private readonly emailRepo: EmailRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly dbiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly personRepository: PersonRepository,
        private readonly eventService: EventRoutingLegacyKafkaService,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
        configService: ConfigService<ServerConfig>,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');
        this.OX_ENABLED = oxConfig.ENABLED;
    }

    /*
     * Method 'handlePersonRenamedEvent' is replaced by 'handleLdapPersonEntryRenamedEvent' to handle the operations regarding person-renaming synchronously after each other,
     * first in LdapEventHandler then here in EmailEventHandler.
     */
    @KafkaEventHandler(KafkaLdapPersonEntryRenamedEvent)
    @EventHandler(LdapPersonEntryRenamedEvent)
    @EnsureRequestContext()
    public async handleLdapPersonEntryRenamedEvent(event: LdapPersonEntryRenamedEvent): Promise<void> {
        this.logger.info(
            `Received LdapPersonEntryRenamedEvent, personId:${event.personId}, username:${event.username}, oldUsername:${event.oldUsername}`,
        );
        const rollenWithPK: Map<string, RolleWithPK> = await this.getRollenWithPKForPerson(event.personId);
        const rollen: Rolle<true>[] = Array.from(rollenWithPK.values(), (value: RolleWithPK) => {
            return value.rolle;
        });
        const rollenIdWithSPReference: Option<string> = await this.getAnyRolleReferencesEmailServiceProvider(rollen);
        if (rollenIdWithSPReference) {
            const existingEmail: Option<EmailAddress<true>> = await this.emailRepo.findEnabledByPerson(event.personId);
            if (existingEmail) {
                this.logger.info(
                    `Existing email found for personId:${event.personId}, address:${existingEmail.address}, username:${event.username}`,
                );
                if (existingEmail.enabledOrRequested) {
                    existingEmail.disable();
                    const persistenceResult: EmailAddress<true> | DomainError =
                        await this.emailRepo.save(existingEmail);
                    if (persistenceResult instanceof EmailAddress) {
                        this.logger.info(
                            `DISABLED and saved address:${persistenceResult.address}, personId:${event.personId}, username:${event.username}`,
                        );
                    } else {
                        this.logger.error(
                            `Could not DISABLE email, personId:${event.personId}, username:${event.username}, error:${persistenceResult.message}`,
                        );
                    }
                }
            }
            const pkForRolleWithSPReference: RolleWithPK | undefined = rollenWithPK.get(rollenIdWithSPReference);
            if (pkForRolleWithSPReference) {
                if (existingEmail) {
                    await this.changeEmail(
                        event.personId,
                        pkForRolleWithSPReference.personenkontext.organisationId,
                        existingEmail,
                    );
                } else {
                    await this.createNewEmail(event.personId, pkForRolleWithSPReference.personenkontext.organisationId);
                }
            }
        } else {
            const existingDisabledEmails: EmailAddress<true>[] = await this.emailRepo.findByPersonSortedByUpdatedAtDesc(
                event.personId,
                EmailAddressStatus.DISABLED,
            );
            if (existingDisabledEmails.length === 0 || !existingDisabledEmails[0]) {
                return this.logger.info(
                    `Renamed person with personId:${event.personId}, username:${event.username} has no SP with Email and no existing DISABLED addresses, nothing to do`,
                );
            }
            const mostRecentDisabledEmail: EmailAddress<true> = existingDisabledEmails[0];
            const splitted: string[] = mostRecentDisabledEmail.address.split('@');
            if (!splitted[1]) {
                return this.logger.error(
                    `Could not extract domain from existing DISABLED email-address, personId:${event.personId}, username:${event.username}`,
                );
            }
            await this.createNewDisabledEmail(event.personId, splitted[1]);
        }
    }

    private async getRollenWithPKForPerson(personId: PersonID): Promise<Map<string, RolleWithPK>> {
        const personenkontexte: Personenkontext<true>[] = await this.dbiamPersonenkontextRepo.findByPerson(personId);
        const rollenIdPKMap: Map<string, Personenkontext<true>> = new Map<string, Personenkontext<true>>();

        for (const personenkontext of personenkontexte) {
            rollenIdPKMap.set(personenkontext.rolleId, personenkontext);
        }
        const rollenIds: string[] = Array.from(rollenIdPKMap.keys(), (value: string) => {
            return value;
        });
        const rollenMap: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rollenIds);

        const resMap: Map<string, RolleWithPK> = new Map<string, RolleWithPK>();
        rollenIds.forEach((rollenId: string) => {
            const pk: Personenkontext<true> | undefined = rollenIdPKMap.get(rollenId);
            const rolle: Rolle<true> | undefined = rollenMap.get(rollenId);
            if (pk && rolle) {
                resMap.set(rollenId, {
                    rolle: rolle,
                    personenkontext: pk,
                });
            }
        });

        return resMap;
    }

    @KafkaEventHandler(KafkaPersonenkontextUpdatedEvent)
    @EventHandler(PersonenkontextUpdatedEvent)
    @EnsureRequestContext()
    // currently receiving of this event is not causing a deletion of email and the related addresses for the affected user, this is intentional
    public async handlePersonenkontextUpdatedEvent(
        event: PersonenkontextUpdatedEvent | KafkaPersonenkontextUpdatedEvent,
    ): Promise<void> {
        this.logger.info(
            `Received PersonenkontextUpdatedEvent, personId:${event.person.id}, username:${event.person.username}, newPKs:${event.newKontexte.length}, removedPKs:${event.removedKontexte.length}`,
        );

        await this.handlePerson(event.person.id, event.person.username, event.removedKontexte);
    }

    // this method cannot make use of handlePerson(personId) method, because personId is already null when event is received
    @KafkaEventHandler(KafkaPersonDeletedEvent)
    @EventHandler(PersonDeletedEvent)
    @EnsureRequestContext()
    public async handlePersonDeletedEvent(event: PersonDeletedEvent | KafkaPersonDeletedEvent): Promise<void> {
        this.logger.info(`Received PersonDeletedEvent, personId:${event.personId}, username:${event.username}`);
        //Setting person_id to null in Email table is done via deleteRule, not necessary here

        if (!event.emailAddress) {
            return this.logger.info(
                `Cannot deactivate email-address, personId:${event.personId}, username:${event.username}, person did not have an email-address`,
            );
        }
        const deactivationResult: EmailAddressEntity | EmailAddressNotFoundError =
            await this.emailRepo.deactivateEmailAddress(event.emailAddress);
        if (deactivationResult instanceof EmailAddressNotFoundError) {
            return this.logger.error(
                `Deactivation of email-address:${event.emailAddress} failed, personId:${event.personId}, username:${event.username}`,
            );
        }

        return this.logger.info(
            `Successfully deactivated email-address:${event.emailAddress}, personId:${event.personId}, username:${event.username}`,
        );
    }

    private async getAnyRolleReferencesEmailServiceProvider(rollen: Rolle<true>[]): Promise<Option<string>> {
        const pro: Promise<Option<string>>[] = rollen.map((rolle: Rolle<true>) =>
            this.rolleReferencesEmailServiceProvider(rolle),
        );
        const rolleIds: Option<string>[] = await Promise.all(pro);

        for (const rolleId of rolleIds) {
            if (rolleId) return rolleId;
        }

        return undefined;
    }

    // disabled for now, since we might run into issues (sheer volume of data) with fetching all affected personenkontexte
    // @KafkaEventHandler(KafkaRolleUpdatedEvent)
    // @EventHandler(RolleUpdatedEvent)
    @EnsureRequestContext()
    public async handleRolleUpdatedEvent(event: RolleUpdatedEvent): Promise<void> {
        this.logger.info(`Received RolleUpdatedEvent, rolleId:${event.id}, rollenArt:${event.rollenArt}`);

        const personenkontexte: Personenkontext<true>[] = await this.dbiamPersonenkontextRepo.findByRolle(event.id);

        //const personIdReferrerSet: Set<[PersonID, PersonReferrer]> = new Set<[PersonID, PersonReferrer]>();

        const personIdUsernameMap: Map<PersonID, PersonReferrer | undefined> = new Map<
            PersonID,
            PersonReferrer | undefined
        >();
        const personIdsSet: Set<PersonID> = new Set<PersonID>();
        personenkontexte.forEach((pk: Personenkontext<true>) => {
            personIdsSet.add(pk.personId);
            personIdUsernameMap.set(pk.personId, pk.referrer);
        });
        const distinctPersonIds: PersonID[] = Array.from(personIdsSet.values());

        this.logger.info(`RolleUpdatedEvent affects:${distinctPersonIds.length} persons`);

        const handlePersonPromises: Promise<void>[] = distinctPersonIds.map((personId: PersonID) => {
            return this.handlePerson(personId, personIdUsernameMap.get(personId));
        });

        await Promise.all(handlePersonPromises);
    }

    @KafkaEventHandler(KafkaOxMetadataInKeycloakChangedEvent)
    @EventHandler(OxMetadataInKeycloakChangedEvent)
    @EnsureRequestContext()
    public async handleOxMetadataInKeycloakChangedEvent(event: OxMetadataInKeycloakChangedEvent): Promise<void> {
        this.logger.info(
            `Received OxMetadataInKeycloakChangedEvent personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}, oxUserName:${event.oxUserName}, contextName:${event.oxContextName}, email:${event.emailAddress}`,
        );
        const email: Option<EmailAddress<true>> = await this.emailRepo.findRequestedByPerson(event.personId);

        if (!email) {
            return this.logger.info(
                `Cannot find REQUESTED email-address for person with personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}, enabling not necessary`,
            );
        }

        if (email.address !== event.emailAddress) {
            this.logger.warning(
                `Mismatch between REQUESTED(${email.address}) and received(${event.emailAddress}) address from OX, personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}`,
            );
            this.logger.warning(
                `Overriding ${email.address} with ${event.emailAddress}) from OX, personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}`,
            );
            email.setAddress(event.emailAddress);
        }

        email.enable();
        email.oxUserID = event.oxUserId;
        const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(email);

        if (persistenceResult instanceof DomainError) {
            return this.logger.error(
                `Could not ENABLE email for personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}, error:${persistenceResult.message}`,
            );
        } else {
            return this.logger.info(
                `Changed email-address:${persistenceResult.address} from REQUESTED to ENABLED, personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}`,
            );
        }
    }

    @KafkaEventHandler(KafkaDisabledOxUserChangedEvent)
    @EventHandler(DisabledOxUserChangedEvent)
    @EnsureRequestContext()
    public async handleDisabledOxUserChangedEvent(event: DisabledOxUserChangedEvent): Promise<void> {
        this.logger.info(
            `Received DisabledOxUserChangedEvent personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}, oxUserName:${event.oxUserName}, contextName:${event.oxContextName}, email:${event.primaryEmail}`,
        );
        const email: Option<EmailAddress<true>> = await this.emailRepo.findRequestedByPerson(event.personId);

        if (!email) {
            return this.logger.error(
                `Cannot find REQUESTED email-address for person with personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}, DISABLING not possible`,
            );
        }

        email.disable();
        email.oxUserID = event.oxUserId;
        const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(email);

        if (persistenceResult instanceof DomainError) {
            return this.logger.error(
                `Could not DISABLE email for personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}, error:${persistenceResult.message}`,
            );
        } else {
            return this.logger.info(
                `Changed email-address:${persistenceResult.address} from REQUESTED to DISABLED, personId:${event.personId}, username:${event.keycloakUsername}, oxUserId:${event.oxUserId}`,
            );
        }
    }

    private async getPersonUsernameOrError(personId: PersonID): Promise<Result<PersonReferrer>> {
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            this.logger.error(`Person Could Not Be Found For personId:${personId}`);
            return {
                ok: false,
                error: new EntityNotFoundError('Person', personId),
            };
        }
        if (!person.referrer) {
            this.logger.error(`Username Could Not Be Found For personId:${personId}`);
            return {
                ok: false,
                error: new PersonDomainError('Person-username NOT defined', personId),
            };
        }

        this.logger.info(`Found username:${person.referrer} for personId:${personId}`);

        return {
            ok: true,
            value: person.referrer,
        };
    }

    private async handlePerson(
        personId: PersonID,
        username: PersonReferrer | undefined,
        removedKontexte?: PersonenkontextEventKontextData[],
    ): Promise<void> {
        // Map to store combinations of rolleId and organisationId as the key
        const rolleIdPKMap: Map<string, Personenkontext<true>> = new Map<string, Personenkontext<true>>();

        // Retrieve all personenkontexte for the given personId
        let personenkontexte: Personenkontext<true>[] = await this.dbiamPersonenkontextRepo.findByPerson(personId);
        // in case PersonenkontextUpdateEvent is result of PersonDeletion, no PK that is going to be removed, should trigger createOrEnableEmail
        if (removedKontexte) {
            personenkontexte = personenkontexte.filter((pk: Personenkontext<true>) =>
                removedKontexte.every((removedPK: PersonenkontextEventKontextData) => removedPK.id !== pk.id),
            );
        }

        // Array to hold the role IDs
        const rollenIds: string[] = [];

        // Process each personenkontext and add it to the map and array
        personenkontexte.forEach((pk: Personenkontext<true>) => {
            // Use combination of rolleId and organisationId as the key
            const key: string = `${pk.rolleId}-${pk.organisationId}`;
            rolleIdPKMap.set(key, pk);
            rollenIds.push(pk.rolleId);
        });

        // Retrieve role details based on the role IDs
        const rollenMap: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rollenIds);
        const rollen: Rolle<true>[] = Array.from(rollenMap.values());

        // Check if any role has a reference to an SP for email service provider
        const rollenIdWithSPReference: Option<string> = await this.getAnyRolleReferencesEmailServiceProvider(rollen);

        if (rollenIdWithSPReference) {
            await this.handlePersonWithEmailSPReference(
                personId,
                username,
                personenkontexte,
                rollenIdWithSPReference,
                rolleIdPKMap,
            );
        } else {
            // If no role references an SP, disable any existing emails
            await this.handlePersonWithoutEmailSPReference(personId, username);
        }
    }

    private async handlePersonWithEmailSPReference(
        personId: PersonID,
        username: PersonReferrer | undefined,
        personenkontexte: Personenkontext<true>[],
        rollenIdWithSPReference: string,
        rolleIdPKMap: Map<string, Personenkontext<true>>,
    ): Promise<void> {
        // Array to store matching Personenkontext objects for further processing
        const pkOfRolleWithSPReferenceList: Personenkontext<true>[] = [];

        // Check all combinations of rolleId and organisationId for this role
        for (const pk of personenkontexte) {
            if (pk.rolleId === rollenIdWithSPReference) {
                const key: string = `${pk.rolleId}-${pk.organisationId}`;
                const pkFromMap: Personenkontext<true> | undefined = rolleIdPKMap.get(key);
                if (pkFromMap) {
                    pkOfRolleWithSPReferenceList.push(pkFromMap); // Collect valid matches
                }
            }
        }

        // Process each valid Personenkontext
        if (pkOfRolleWithSPReferenceList.length > 0) {
            this.logger.info(
                `Person with personId:${personId}, username:${username} needs an email, creating or enabling address`,
            );
            // Iterate over all valid Personenkontext objects and trigger email creation
            for (const pkOfRolleWithSPReference of pkOfRolleWithSPReferenceList) {
                // eslint-disable-next-line no-await-in-loop
                await this.createOrEnableEmail(personId, pkOfRolleWithSPReference.organisationId);
            }
        } else {
            this.logger.error(
                `Rolle with id:${rollenIdWithSPReference} references SP, but no matching Personenkontext was found`,
            );
        }
    }

    private async handlePersonWithoutEmailSPReference(
        personId: PersonID,
        username: PersonReferrer | undefined,
    ): Promise<void> {
        if (!this.OX_ENABLED) {
            return this.logger.info(
                `OX is not enabled, no email will be disabled for personId:${personId}, username:${username}`,
            );
        }

        const existingEmails: Option<EmailAddress<true>[]> =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId);

        let anyEmailWasDisabled: boolean = false;
        if (existingEmails) {
            await Promise.allSettled(
                existingEmails
                    .filter((existingEmail: EmailAddress<true>) => !existingEmail.disabled)
                    .map(async (existingEmail: EmailAddress<true>) => {
                        this.logger.info(
                            `Existing email found for personId:${personId}, address:${existingEmail.address}`,
                        );
                        existingEmail.disable();
                        const persistenceResult: EmailAddress<true> | DomainError =
                            await this.emailRepo.save(existingEmail);

                        if (persistenceResult instanceof EmailAddress) {
                            anyEmailWasDisabled = true;
                            this.logger.info(
                                `DISABLED and saved address:${persistenceResult.address}, personId:${personId}, username:${username}`,
                            );
                        } else {
                            this.logger.error(
                                `Could not DISABLE email, personId:${personId}, username:${username}, error:${persistenceResult.message}`,
                            );
                        }
                    }),
            );

            if (anyEmailWasDisabled) {
                const person: Option<Person<true>> = await this.personRepository.findById(personId);
                if (!person || !person.referrer) {
                    this.logger.error(
                        `Could not publish EmailAddressDisabledEvent, personId:${personId} has no username`,
                    );
                } else {
                    this.eventService.publish(
                        new EmailAddressDisabledEvent(personId, person.referrer),
                        new KafkaEmailAddressDisabledEvent(personId, person.referrer),
                    );
                }
            }
        }
    }

    private async getOrganisationKennung(organisationId: OrganisationID): Promise<Result<OrganisationKennung>> {
        const organisation: Option<Organisation<true>> = await this.organisationRepository.findById(organisationId);
        if (!organisation || !organisation.kennung) {
            this.logger.error(`Could not retrieve orgaKennung, orgaId:${organisationId}`);
            return {
                ok: false,
                error: new EntityNotFoundError('organisation', organisationId),
            };
        }
        return {
            ok: true,
            value: organisation.kennung,
        };
    }

    private async createOrEnableEmail(personId: PersonID, organisationId: OrganisationID): Promise<void> {
        const organisationKennung: Result<OrganisationKennung> = await this.getOrganisationKennung(organisationId);
        if (!organisationKennung.ok) return;

        const existingEmails: EmailAddress<true>[] = await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId);

        if (existingEmails.length > 0) {
            // Publish the EmailAddressAlreadyExistsEvent as the User already has an email.
            // The status of the email is not relevant to adding the user in the OX group.
            this.eventService.publish(
                new EmailAddressAlreadyExistsEvent(personId, organisationKennung.value),
                new KafkaEmailAddressAlreadyExistsEvent(personId, organisationKennung.value),
            );
        }

        const personUsername: Result<string> = await this.getPersonUsernameOrError(personId);
        if (!personUsername.ok) {
            return; //error logging is done in getPersonUsernameOrError
        }
        for (const email of existingEmails) {
            if (email.enabled) {
                return this.logger.info(
                    `Existing email for personId:${personId}, username:${personUsername.value} already ENABLED`,
                );
            } else if (email.disabled && this.OX_ENABLED) {
                // If we find a disabled address, we just enable it again
                email.enable();

                // Will return after the first iteration, so it's not an await in a loop
                // eslint-disable-next-line no-await-in-loop
                const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(email);
                if (persistenceResult instanceof EmailAddress) {
                    this.logger.info(
                        `Set REQUESTED status and persisted address:${persistenceResult.address}, personId:${personId}, username:${personUsername.value}`,
                    );
                    // eslint-disable-next-line no-await-in-loop
                    this.eventService.publish(
                        new EmailAddressGeneratedEvent(
                            personId,
                            personUsername.value,
                            persistenceResult.id,
                            persistenceResult.address,
                            persistenceResult.enabled,
                            organisationKennung.value,
                        ),
                        new KafkaEmailAddressGeneratedEvent(
                            personId,
                            personUsername.value,
                            persistenceResult.id,
                            persistenceResult.address,
                            persistenceResult.enabled,
                            organisationKennung.value,
                        ),
                    );
                } else {
                    this.logger.error(
                        `Could not ENABLE email for personId:${personId}, username:${personUsername.value}, error:${persistenceResult.message}`,
                    );
                }

                return;
            }
        }
        this.logger.info(
            `No existing email found for personId:${personId}, username:${personUsername.value}, creating a new one`,
        );
        await this.createNewEmail(personId, organisationId);
    }

    private async createAndPersistFailedEmailAddress(
        personId: PersonID,
        username: PersonReferrer | undefined,
    ): Promise<void> {
        const personIdAndTimestamp: string = personId + '-' + Date.now();
        const failedEmailAddress: EmailAddress<false> = EmailAddress.createNew(
            personId,
            personIdAndTimestamp,
            EmailAddressStatus.FAILED,
        );

        const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(failedEmailAddress);
        if (persistenceResult instanceof EmailAddress) {
            this.logger.info(
                `Successfully persisted email with FAILED status for address:${persistenceResult.address}, personId:${personId}, username:${username}`,
            );
        } else {
            this.logger.error(
                `Could not persist email for personId:${personId}, username:${username}, error:${persistenceResult.message}`,
            );
        }
    }

    private async createNewEmail(personId: PersonID, organisationId: OrganisationID): Promise<void> {
        const organisationKennung: Result<OrganisationKennung> = await this.getOrganisationKennung(organisationId);
        if (!organisationKennung.ok) return;
        const personUsername: Result<string> = await this.getPersonUsernameOrError(personId);
        if (!personUsername.ok) {
            return; //error logging is done in getPersonUsernameOrError
        }
        const email: Result<EmailAddress<false>> = await this.emailFactory.createNew(personId, organisationId);
        if (!email.ok) {
            await this.createAndPersistFailedEmailAddress(personId, personUsername.value);
            return this.logger.error(
                `Could not create new email for personId:${personId}, username:${personUsername.value}, error:${email.error.message}`,
            );
        }
        email.value.request();
        const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(email.value);
        if (persistenceResult instanceof EmailAddress) {
            this.logger.info(
                `Successfully persisted email with REQUEST status for address:${persistenceResult.address}, personId:${personId}, username:${personUsername.value}`,
            );
            this.eventService.publish(
                new EmailAddressGeneratedEvent(
                    personId,
                    personUsername.value,
                    persistenceResult.id,
                    persistenceResult.address,
                    persistenceResult.enabled,
                    organisationKennung.value,
                ),
                new KafkaEmailAddressGeneratedEvent(
                    personId,
                    personUsername.value,
                    persistenceResult.id,
                    persistenceResult.address,
                    persistenceResult.enabled,
                    organisationKennung.value,
                ),
            );
        } else {
            this.logger.error(
                `Could not persist email for personId:${personId}, username:${personUsername.value}, error:${persistenceResult.message}`,
            );
        }
    }

    private async createNewDisabledEmail(personId: PersonID, emailDomain: string): Promise<void> {
        const personUsername: Result<string> = await this.getPersonUsernameOrError(personId);
        if (!personUsername.ok) {
            return; //error logging is done in getPersonUsernameOrError
        }
        const email: Result<EmailAddress<false>> = await this.emailFactory.createNewFromPersonIdAndDomain(
            personId,
            emailDomain,
        );
        if (!email.ok) {
            await this.createAndPersistFailedEmailAddress(personId, personUsername.value);
            return this.logger.error(
                `Could not create new and DISABLED email for personId:${personId}, username:${personUsername.value}, error:${email.error.message}`,
            );
        }
        email.value.request();
        const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(email.value);
        if (persistenceResult instanceof EmailAddress) {
            this.logger.info(
                `Successfully persisted new email with DISABLED status for address:${persistenceResult.address}, personId:${personId}, username:${personUsername.value}`,
            );
            this.eventService.publish(
                new DisabledEmailAddressGeneratedEvent(
                    personId,
                    personUsername.value,
                    persistenceResult.id,
                    persistenceResult.address,
                    emailDomain,
                ),
                new KafkaDisabledEmailAddressGeneratedEvent(
                    personId,
                    personUsername.value,
                    persistenceResult.id,
                    persistenceResult.address,
                    emailDomain,
                ),
            );
        } else {
            this.logger.error(
                `Could not persist email for personId:${personId}, username:${personUsername.value}, error:${persistenceResult.message}`,
            );
        }
    }

    private async changeEmail(
        personId: PersonID,
        organisationId: OrganisationID,
        oldEmail: EmailAddress<true>,
    ): Promise<void> {
        const organisationKennung: Result<OrganisationKennung> = await this.getOrganisationKennung(organisationId);
        if (!organisationKennung.ok) return;
        const personUsername: Result<string> = await this.getPersonUsernameOrError(personId);
        if (!personUsername.ok) {
            return; //error logging is done in getPersonUsernameOrError
        }
        const email: Result<EmailAddress<false>> = await this.emailFactory.createNew(personId, organisationId);
        if (!email.ok) {
            await this.createAndPersistFailedEmailAddress(personId, personUsername.value);

            return this.logger.error(
                `Could not create change-email for personId:${personId}, username:${personUsername.value}, error:${email.error.message}`,
            );
        }
        email.value.request();
        const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(email.value);
        if (persistenceResult instanceof EmailAddress) {
            this.logger.info(
                `Successfully persisted change-email with REQUEST status for address:${persistenceResult.address}, personId:${personId}, username:${personUsername.value}`,
            );
            this.eventService.publish(
                new EmailAddressChangedEvent(
                    personId,
                    personUsername.value,
                    oldEmail.id,
                    oldEmail.address,
                    persistenceResult.id,
                    persistenceResult.address,
                    organisationKennung.value,
                ),
                new KafkaEmailAddressChangedEvent(
                    personId,
                    personUsername.value,
                    oldEmail.id,
                    oldEmail.address,
                    persistenceResult.id,
                    persistenceResult.address,
                    organisationKennung.value,
                ),
            );
        } else {
            this.logger.error(
                `Could not persist change-email for personId:${personId}, username:${personUsername.value}, error:${persistenceResult.message}`,
            );
        }
    }

    private async rolleReferencesEmailServiceProvider(rolle: Rolle<true>): Promise<Option<string>> {
        const serviceProviderMap: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            rolle.serviceProviderIds,
        );
        const serviceProviders: ServiceProvider<true>[] = Array.from(
            serviceProviderMap.values(),
            (value: ServiceProvider<true>) => {
                return value;
            },
        );

        const references: boolean = serviceProviders.some(
            (sp: ServiceProvider<true>) => sp.kategorie === ServiceProviderKategorie.EMAIL,
        );

        if (references) return rolle.id;

        return undefined;
    }
}
