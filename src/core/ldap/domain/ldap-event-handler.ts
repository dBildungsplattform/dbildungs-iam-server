import { Injectable } from '@nestjs/common';
import { EventHandler } from '../../eventbus/decorators/event-handler.decorator.js';
import { LdapClientService, PersonData } from './ldap-client.service.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { PersonenkontextEventKontextData } from '../../../shared/events/personenkontext-event.types.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { OrganisationID, PersonID, PersonReferrer } from '../../../shared/types/aggregate-ids.types.js';
import { OrganisationRepository } from '../../../modules/organisation/persistence/organisation.repository.js';
import { LdapEmailDomainError } from '../error/ldap-email-domain.error.js';
import { EmailAddressChangedEvent } from '../../../shared/events/email/email-address-changed.event.js';
import { EventRoutingLegacyKafkaService } from '../../eventbus/services/event-routing-legacy-kafka.service.js';
import { LdapPersonEntryRenamedEvent } from '../../../shared/events/ldap/ldap-person-entry-renamed.event.js';
import { PersonRenamedEvent } from '../../../shared/events/person-renamed-event.js';
import { KafkaPersonDeletedEvent } from '../../../shared/events/kafka-person-deleted.event.js';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event.js';
import { KafkaEventHandler } from '../../eventbus/decorators/kafka-event-handler.decorator.js';
import { KafkaPersonRenamedEvent } from '../../../shared/events/kafka-person-renamed-event.js';
import { KafkaEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-email-address-generated.event.js';
import { KafkaEmailAddressChangedEvent } from '../../../shared/events/email/kafka-email-address-changed.event.js';
import { inspect } from 'util';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { Person } from '../../../modules/person/domain/person.js';
import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { EmailAddressMarkedForDeletionEvent } from '../../../shared/events/email/email-address-marked-for-deletion.event.js';
import { LdapEmailAddressDeletedEvent } from '../../../shared/events/ldap/ldap-email-address-deleted.event.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email/email-addresses-purged.event.js';
import { KafkaEmailAddressesPurgedEvent } from '../../../shared/events/email/kafka-email-addresses-purged.event.js';
import { LdapEntryDeletedEvent } from '../../../shared/events/ldap/ldap-entry-deleted.event.js';
import { EmailAddressGeneratedEvent } from '../../../shared/events/email/email-address-generated.event.js';
import { PersonDeletedAfterDeadlineExceededEvent } from '../../../shared/events/person-deleted-after-deadline-exceeded.event.js';
import { KafkaPersonDeletedAfterDeadlineExceededEvent } from '../../../shared/events/kafka-person-deleted-after-deadline-exceeded.event.js';
import { KafkaLdapPersonEntryRenamedEvent } from '../../../shared/events/ldap/kafka-ldap-person-entry-renamed.event.js';
import { KafkaLdapEntryDeletedEvent } from '../../../shared/events/ldap/kafka-ldap-entry-deleted.event.js';
import { LdapDeleteLehrerError } from '../error/ldap-delete-lehrer.error.js';
import { KafkaEmailAddressMarkedForDeletionEvent } from '../../../shared/events/email/kafka-email-address-marked-for-deletion.event.js';
import { KafkaLdapEmailAddressDeletedEvent } from '../../../shared/events/ldap/kafka-ldap-email-address-deleted.event.js';

@Injectable()
export class LdapEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly ldapClientService: LdapClientService,
        private readonly organisationRepository: OrganisationRepository,
        private readonly personRepo: PersonRepository,
        private readonly eventService: EventRoutingLegacyKafkaService,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {}

    private async getEmailDomainForOrganisationId(organisationId: OrganisationID): Promise<Result<string>> {
        const emailDomain: string | undefined =
            await this.organisationRepository.findEmailDomainForOrganisation(organisationId);
        if (emailDomain)
            return {
                ok: true,
                value: emailDomain,
            };

        return { ok: false, error: new LdapEmailDomainError() };
    }

    @KafkaEventHandler(KafkaPersonDeletedEvent)
    @EventHandler(PersonDeletedEvent)
    @EnsureRequestContext()
    public async handlePersonDeletedEvent(
        event: PersonDeletedEvent | KafkaPersonDeletedEvent,
    ): Promise<Result<unknown>> {
        this.logger.info(
            `Received PersonenkontextDeletedEvent, personId:${event.personId}, username:${event.username}`,
        );
        const deletionResult: Result<PersonID> = await this.ldapClientService.deleteLehrerByUsername(event.username);
        if (!deletionResult.ok) {
            this.logger.error(deletionResult.error.message);
        }

        return deletionResult;
    }

    @EventHandler(PersonDeletedAfterDeadlineExceededEvent)
    @KafkaEventHandler(KafkaPersonDeletedAfterDeadlineExceededEvent)
    @EnsureRequestContext()
    public async handlePersonDeletedAfterDeadlineExceededEvent(
        event: PersonDeletedAfterDeadlineExceededEvent | KafkaPersonDeletedAfterDeadlineExceededEvent,
    ): Promise<Result<unknown>> {
        this.logger.info(
            `Received PersonDeletedAfterDeadlineExceededEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
        );
        const deletionResult: Result<PersonID> = await this.ldapClientService.deleteLehrerByUsername(event.username);
        if (!deletionResult.ok) {
            this.logger.error(deletionResult.error.message);
        }

        return deletionResult;
    }

    @KafkaEventHandler(KafkaPersonRenamedEvent)
    @EventHandler(PersonRenamedEvent)
    @EnsureRequestContext()
    public async personRenamedEventHandler(
        event: PersonRenamedEvent | KafkaPersonRenamedEvent,
    ): Promise<Result<unknown>> {
        this.logger.info(
            `Received PersonRenamedEvent, personId:${event.personId}, username:${event.username}, oldUsername:${event.oldUsername}`,
        );
        const modifyResult: Result<PersonReferrer> = await this.ldapClientService.modifyPersonAttributes(
            event.oldUsername,
            event.vorname,
            event.familienname,
            event.username,
        );
        if (!modifyResult.ok) {
            this.logger.error(modifyResult.error.message);
            return modifyResult;
        }

        this.logger.info(`Successfully modified person attributes in LDAP for personId:${event.personId}`);
        this.eventService.publish(
            LdapPersonEntryRenamedEvent.fromPersonRenamedEvent(event),
            KafkaLdapPersonEntryRenamedEvent.fromPersonRenamedEvent(event),
        );

        return modifyResult;
    }

    @KafkaEventHandler(KafkaPersonenkontextUpdatedEvent)
    @EventHandler(PersonenkontextUpdatedEvent)
    @EnsureRequestContext()
    public async handlePersonenkontextUpdatedEvent(
        event: PersonenkontextUpdatedEvent | KafkaPersonenkontextUpdatedEvent,
    ): Promise<Result<unknown>> {
        this.logger.info(
            `Received PersonenkontextUpdatedEvent, personId:${event.person.id}, username:${event.person.username}, newPKs:${event.newKontexte.length}, removedPKs:${event.removedKontexte.length}`,
        );

        const removeResults: PromiseSettledResult<Result<boolean>>[] = await Promise.allSettled(
            event.removedKontexte
                .filter(
                    (pk: PersonenkontextEventKontextData) =>
                        pk.rolle === RollenArt.LEHR && !this.hatZuordnungZuOrganisationNachLoeschen(event, pk),
                )
                .map((pk: PersonenkontextEventKontextData) => {
                    if (!pk.orgaKennung) {
                        return Promise.reject(new Error('Organisation has no Kennung'));
                    }
                    return this.getEmailDomainForOrganisationId(pk.orgaId)
                        .catch((error: Error) => {
                            this.logger.error(`Error in getEmailDomainForOrganisationId: ${error.message}`);
                            return Promise.reject(error);
                        })
                        .then((emailDomain: Result<string>) => {
                            if (emailDomain.ok) {
                                this.logger.info(`Call LdapClientService because rollenArt is LEHR, pkId: ${pk.id}`);
                                return this.ldapClientService
                                    .removePersonFromGroupByUsernameAndKennung(
                                        event.person.username!,
                                        pk.orgaKennung!,
                                        emailDomain.value,
                                    )
                                    .then((removeFromGroupResult: Result<boolean>) => {
                                        if (!removeFromGroupResult.ok) {
                                            this.logger.error(removeFromGroupResult.error.message);
                                        }
                                        return removeFromGroupResult;
                                    })
                                    .catch((error: Error) => {
                                        this.logger.error(`Error in removePersonFromGroup: ${error.message}`);
                                        return Promise.reject(error);
                                    });
                            } else {
                                this.logger.error(
                                    `LdapClientService removePersonFromGroup NOT called, because organisation:${pk.orgaId} has no valid emailDomain`,
                                );
                                return Promise.reject(new Error('Invalid email domain'));
                            }
                        });
                }),
        );

        // Create personenkontexte if rollenart === LEHR
        const newKontexteResults: PromiseSettledResult<Result<PersonData>>[] = await Promise.allSettled(
            event.newKontexte
                .filter((pk: PersonenkontextEventKontextData) => pk.rolle === RollenArt.LEHR)
                .map((pk: PersonenkontextEventKontextData) => {
                    this.logger.info(`Call LdapClientService because rollenArt is LEHR`);
                    if (!pk.orgaKennung) {
                        return Promise.reject(new Error('Organisation has no Kennung'));
                    }
                    return this.getEmailDomainForOrganisationId(pk.orgaId)
                        .catch((error: Error) => {
                            this.logger.error(`Error in getEmailDomainForOrganisationId: ${error.message}`);
                            return Promise.reject(error);
                        })
                        .then((emailDomain: Result<string>) => {
                            if (emailDomain.ok) {
                                return this.ldapClientService
                                    .createLehrer(event.person, emailDomain.value, pk.orgaKennung!)
                                    .then(async (creationResult: Result<PersonData>) => {
                                        if (!creationResult.ok) {
                                            this.logger.error(creationResult.error.message);
                                        } else {
                                            const person: Option<Person<true>> = await this.personRepo.findById(
                                                event.person.id,
                                            );
                                            if (!person) {
                                                this.logger.error(
                                                    `LdapClientService createLehrer could not find person with id:${event.person.id}, ref:${event.person.username}`,
                                                );
                                            } else if (creationResult.value.ldapEntryUUID) {
                                                person.externalIds.LDAP = creationResult.value.ldapEntryUUID;
                                                await this.personRepo.save(person);
                                            }
                                        }

                                        return creationResult;
                                    })
                                    .catch((error: Error) => {
                                        this.logger.error(`Error in createLehrer: ${error.message}`);
                                        return Promise.reject(error);
                                    });
                            } else {
                                this.logger.error(
                                    `LdapClientService createLehrer NOT called, because organisation:${pk.orgaId} has no valid emailDomain`,
                                );
                                return Promise.reject({ ok: false, error: new Error('Invalid email domain') });
                            }
                        });
                }),
        );

        const combinedResults: PromiseSettledResult<Result<unknown>>[] = [...removeResults, ...newKontexteResults];
        const failureReasons: string[] = combinedResults.reduce(
            (acc: string[], result: PromiseSettledResult<Result<unknown, Error>>) => {
                if (result.status === 'rejected') {
                    acc.push(inspect(result.reason));
                } else if (result.status === 'fulfilled' && !result.value.ok) {
                    acc.push(inspect(result.value.error));
                }
                return acc;
            },
            [],
        );

        if (failureReasons.length > 0) {
            return { ok: false, error: new Error(failureReasons.join(', ')) };
        }

        return { ok: true, value: null };
    }

    @KafkaEventHandler(KafkaEmailAddressGeneratedEvent)
    @EventHandler(EmailAddressGeneratedEvent)
    @EnsureRequestContext()
    public async handleEmailAddressGeneratedEvent(
        event: EmailAddressGeneratedEvent | KafkaEmailAddressGeneratedEvent,
    ): Promise<Result<unknown>> {
        this.logger.info(
            `Received EmailAddressGeneratedEvent, personId:${event.personId}, username:${event.username}, emailAddress:${event.address}`,
        );

        const result: Result<PersonID> = await this.ldapClientService.changeEmailAddressByPersonId(
            event.personId,
            event.username,
            event.address,
        );

        return result;
    }

    @KafkaEventHandler(KafkaEmailAddressChangedEvent)
    @EventHandler(EmailAddressChangedEvent)
    @EnsureRequestContext()
    public async handleEmailAddressChangedEvent(
        event: EmailAddressChangedEvent | KafkaEmailAddressChangedEvent,
    ): Promise<Result<unknown>> {
        this.logger.info(
            `Received EmailAddressChangedEvent, personId:${event.personId}, newEmailAddress:${event.newAddress}, oldEmailAddress:${event.oldAddress}`,
        );

        const result: Result<PersonID> = await this.ldapClientService.changeEmailAddressByPersonId(
            event.personId,
            event.username,
            event.newAddress,
        );

        return result;
    }

    @KafkaEventHandler(KafkaEmailAddressMarkedForDeletionEvent)
    @EventHandler(EmailAddressMarkedForDeletionEvent)
    @EnsureRequestContext()
    public async handleEmailAddressMarkedForDeletionEvent(
        event: EmailAddressMarkedForDeletionEvent,
    ): Promise<Result<unknown>> {
        this.logger.info(
            `Received EmailAddressDeletedEvent, personId:${event.personId}, username:${event.username}, address:${event.address}`,
        );
        if (!event.username) {
            this.logger.info(
                `Username UNDEFINED in EmailAddressDeletedEvent, skipping removal of MailAlternativeAddress in LDAP, oxUserId:${event.oxUserId}`,
            );
            // publish event to satisfy event-chain (necessary: DELETED_LDAP + DELETED_OX = DELETED -> remove EmailAddress from DB)
            this.eventService.publish(
                new LdapEmailAddressDeletedEvent(event.personId, undefined, event.address),
                new KafkaLdapEmailAddressDeletedEvent(event.personId, event.username, event.address),
            );
            return { ok: true, value: undefined };
        }
        const result: Result<boolean> = await this.ldapClientService.removeMailAlternativeAddress(
            event.personId,
            event.username,
            event.address,
        );

        if (result.ok) {
            this.eventService.publish(
                new LdapEmailAddressDeletedEvent(event.personId, event.username, event.address),
                new KafkaLdapEmailAddressDeletedEvent(event.personId, event.username, event.address),
            );
        }

        return result;
    }

    @KafkaEventHandler(KafkaEmailAddressesPurgedEvent)
    @EventHandler(EmailAddressesPurgedEvent)
    public async handleEmailAddressesPurgedEvent(event: EmailAddressesPurgedEvent): Promise<Result<unknown>> {
        this.logger.info(
            `Received EmailAddressesPurgedEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
        );

        if (!event.username) {
            this.logger.info(`Cannot delete lehrer by username, username is UNDEFINED, oxUserId:${event.oxUserId}`);
            return {
                ok: false,
                error: new LdapDeleteLehrerError(),
            };
        }

        const deletionResult: Result<PersonID> = await this.ldapClientService.deleteLehrerByUsername(event.username);
        if (!deletionResult.ok) {
            this.logger.error(deletionResult.error.message);
        } else {
            this.eventService.publish(
                new LdapEntryDeletedEvent(event.personId, event.username),
                new KafkaLdapEntryDeletedEvent(event.personId, event.username),
            );
        }

        return deletionResult;
    }

    public hatZuordnungZuOrganisationNachLoeschen(
        personenkontextUpdatedEvent: PersonenkontextUpdatedEvent,
        personenkontextEventKontextData: PersonenkontextEventKontextData,
    ): boolean {
        const orgaId: OrganisationID = personenkontextEventKontextData.orgaId;
        const currentOrgaIds: OrganisationID[] = personenkontextUpdatedEvent.currentKontexte.map(
            (pk: PersonenkontextEventKontextData) => pk.orgaId,
        );

        return currentOrgaIds.includes(orgaId);
    }
}
