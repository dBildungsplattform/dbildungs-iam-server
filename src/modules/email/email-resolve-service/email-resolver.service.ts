import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailAddressResponse } from '../../../email/modules/core/api/dtos/response/email-address.response.js';
import { EmailAddressStatusEnum } from '../../../email/modules/core/persistence/email-address-status.entity.js';
import { EmailMicroserviceConfig } from '../../../shared/config/email-microservice.config.js';
import { PersonenkontextEventKontextData } from '../../../shared/events/personenkontext-event.types.js';
import { PersonenkontextUpdatedPersonData } from '../../../shared/events/personenkontext-updated.event.js';
import { PersonEmailResponse } from '../../person/api/person-email-response.js';
import { Person } from '../../person/domain/person.js';
import { EmailAddressStatus } from '../domain/email-address.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';

@Injectable()
export class EmailResolverService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly emailRepo: EmailRepo,
        private readonly rolleRepo: RolleRepo,
    ) {}

    public shouldUseEmailMicroservice(): boolean {
        const emailMicroserviceConfig: EmailMicroserviceConfig =
            this.configService.getOrThrow<EmailMicroserviceConfig>('EMAIL_MICROSERVICE');
        return emailMicroserviceConfig.USE_EMAIL_MICROSERVICE;
    }

    public getEndpoint(): string {
        const emailMicroserviceConfig: EmailMicroserviceConfig =
            this.configService.getOrThrow<EmailMicroserviceConfig>('EMAIL_MICROSERVICE');
        return emailMicroserviceConfig.ENDPOINT;
    }

    public async getEmailAddressAndStatusForPerson(person: Person<true>): Promise<PersonEmailResponse | undefined> {
        const useEmailMicroservice: boolean = this.shouldUseEmailMicroservice();
        const endpoint: string = this.getEndpoint();
        return useEmailMicroservice
            ? this.findEmail(endpoint, person)
            : await this.emailRepo.getEmailAddressAndStatusForPerson(person);
    }

    public async findEmail(endpoint: string, person: Person<true>): Promise<PersonEmailResponse | undefined> {
        try {
            const response: AxiosResponse<EmailAddressResponse[]> = await lastValueFrom(
                this.httpService.get(endpoint + `read/${person.id}`, { method: 'GET' }),
            );
            if (response.data[0] !== undefined) {
                const status: EmailAddressStatus = this.mapStatus(response.data[0]?.status);
                return new PersonEmailResponse(status, response.data[0].address);
            }
            return undefined;
        } catch (error) {
            this.logger.logUnknownAsError(`Failed to fetch email for person ${person.id}`, error);
            return undefined;
        }
    }

    public async setEmailAddressForPerson(
        person: PersonenkontextUpdatedPersonData,
        currentKontexte: PersonenkontextEventKontextData[],
    ): Promise<void> {
        const spId: string | undefined = await this.getEmailServiceProviderId(currentKontexte);
        if (spId) {
            await this.setEmail(this.getEndpoint(), person, spId);
        }
    }

    public async setEmail(endpoint: string, person: PersonenkontextUpdatedPersonData, spId: string): Promise<void> {
        try {
            // For now just mocking the post
            this.logger.info(`Setting email for person ${person.id} via email microservice with spId ${spId}`);
            await lastValueFrom(
                this.httpService.post(endpoint + `write/set-email-for-person`, {
                    spshPersonId: person.id,
                    firstName: person.vorname,
                    lastName: person.familienname,
                    spshServiceProviderId: spId,
                }),
            );
        } catch (error) {
            this.logger.logUnknownAsError(`Failed to set email for person ${person.id}`, error);
        }
    }

    public async getEmailServiceProviderId(
        currentKontexte: PersonenkontextEventKontextData[],
    ): Promise<string | undefined> {
        // Array to hold the role IDs
        const rollenIds: string[] = currentKontexte.map((pk: PersonenkontextEventKontextData) => pk.rolleId);

        // Retrieve role details based on the role IDs
        const rollenMap: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rollenIds);
        const rollen: Rolle<true>[] = Array.from(rollenMap.values());

        const spshServiceProviderId: string | undefined = rollen.flatMap((rolle: Rolle<true>) => rolle.serviceProviderData).find(
            (serviceProvider: ServiceProvider<true>) => serviceProvider.externalSystem === ServiceProviderSystem.EMAIL,
        )?.id;

        return spshServiceProviderId;
    }

    public mapStatus(ease: EmailAddressStatusEnum): EmailAddressStatus {
        let eas: EmailAddressStatus;
        switch (ease) {
            case EmailAddressStatusEnum.PENDING:
                eas = EmailAddressStatus.REQUESTED;
                break;
            case EmailAddressStatusEnum.ACTIVE:
                eas = EmailAddressStatus.ENABLED;
                break;
            case EmailAddressStatusEnum.DEACTIVE:
                eas = EmailAddressStatus.DISABLED;
                break;
            case EmailAddressStatusEnum.SUSPENDED:
                eas = EmailAddressStatus.DISABLED; // Maybe adapt
                break;
            case EmailAddressStatusEnum.TO_BE_DELETED:
                eas = EmailAddressStatus.DELETED;
                break;
        }
        return eas;
    }
}
