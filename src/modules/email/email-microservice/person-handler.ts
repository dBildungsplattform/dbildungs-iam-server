import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventRoutingLegacyKafkaService } from "../../../core/eventbus/services/event-routing-legacy-kafka.service.js";
import { ClassLogger } from "../../../core/logging/class-logger.js";
import { EmailAddress } from "../domain/email-address.js";
import { EmailRepo } from "../persistence/email.repo.js";
import { Organisation } from "../../organisation/domain/organisation.js";
import { OrganisationRepository } from "../../organisation/persistence/organisation.repository.js";
import { Person } from "../../person/domain/person.js";
import { PersonDomainError } from "../../person/domain/person-domain.error.js";
import { PersonRepository } from "../../person/persistence/person.repository.js";
import { Personenkontext } from "../../personenkontext/domain/personenkontext.js";
import { DBiamPersonenkontextRepo } from "../../personenkontext/persistence/dbiam-personenkontext.repo.js";
import { Rolle } from "../../rolle/domain/rolle.js";
import { RolleRepo } from "../../rolle/repo/rolle.repo.js";
import { ServiceProvider } from "../../service-provider/domain/service-provider.js";
import { ServiceProviderKategorie } from "../../service-provider/domain/service-provider.enum.js";
import { ServiceProviderRepo } from "../../service-provider/repo/service-provider.repo.js";
import { ServerConfig } from "../../../shared/config/server.config.js";
import { OxConfig } from "../../../shared/config/ox.config.js";
import { DomainError, EntityNotFoundError } from "../../../shared/error/index.js";
import { EmailAddressDisabledEvent } from "../../../shared/events/email/email-address-disabled.event.js";
import { KafkaEmailAddressDisabledEvent } from "../../../shared/events/email/kafka-email-address-disabled.event.js";
import { PersonenkontextEventKontextData } from "../../../shared/events/personenkontext-event.types.js";
import { OrganisationID, OrganisationKennung, PersonID, PersonUsername } from "../../../shared/types/index.js";

@Injectable()
export class PersonHandler {
    public OX_ENABLED: boolean;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailRepo: EmailRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly dbiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly personRepository: PersonRepository,
        private readonly organisationRepository: OrganisationRepository,
        private readonly eventService: EventRoutingLegacyKafkaService,
        configService: ConfigService<ServerConfig>,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');
        this.OX_ENABLED = oxConfig.ENABLED;
    }

    public async handlePerson(
        personId: PersonID,
        username: PersonUsername | undefined,
        removedKontexte?: PersonenkontextEventKontextData[],
    ): Promise<string | void> {
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
            return await this.handlePersonWithEmailSPReference(
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

    public async getAnyRolleReferencesEmailServiceProvider(rollen: Rolle<true>[]): Promise<Option<string>> {
        const pro: Promise<Option<string>>[] = rollen.map((rolle: Rolle<true>) =>
            this.rolleReferencesEmailServiceProvider(rolle),
        );
        const rolleIds: Option<string>[] = await Promise.all(pro);

        for (const rolleId of rolleIds) {
            if (rolleId) {
                return rolleId;
            }
        }

        return undefined;
    }

    public async getOrganisationKennung(organisationId: OrganisationID): Promise<Result<OrganisationKennung>> {
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

    public async getPersonUsernameOrError(personId: PersonID): Promise<Result<PersonUsername>> {
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            this.logger.error(`Person Could Not Be Found For personId:${personId}`);
            return {
                ok: false,
                error: new EntityNotFoundError('Person', personId),
            };
        }
        if (!person.username) {
            this.logger.error(`Username Could Not Be Found For personId:${personId}`);
            return {
                ok: false,
                error: new PersonDomainError('Person-username NOT defined', personId),
            };
        }

        this.logger.info(`Found username:${person.username} for personId:${personId}`);

        return {
            ok: true,
            value: person.username,
        };
    }

    private async handlePersonWithEmailSPReference(
        personId: PersonID,
        username: PersonUsername | undefined,
        personenkontexte: Personenkontext<true>[],
        rollenIdWithSPReference: string,
        rolleIdPKMap: Map<string, Personenkontext<true>>,
    ): Promise<string | void> {
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
            return rollenIdWithSPReference;
        } else {
            this.logger.error(
                `Rolle with id:${rollenIdWithSPReference} references SP, but no matching Personenkontext was found`,
            );
        }
    }
    private async handlePersonWithoutEmailSPReference(
        personId: PersonID,
        username: PersonUsername | undefined,
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
                if (!person || !person.username) {
                    this.logger.error(
                        `Could not publish EmailAddressDisabledEvent, personId:${personId} has no username`,
                    );
                } else {
                    this.eventService.publish(
                        new EmailAddressDisabledEvent(personId, person.username),
                        new KafkaEmailAddressDisabledEvent(personId, person.username),
                    );
                }
            }
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

        if (references) {
            return rolle.id;
        }

        return undefined;
    }
}
