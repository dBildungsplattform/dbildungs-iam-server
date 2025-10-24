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
import { EmailEventHandler } from '../domain/email-event-handler.js';
import { EmailRepo } from '../persistence/email.repo.js';

@Injectable()
export class EmailResolverService {
    constructor(
        private readonly logger: ClassLogger,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly emailRepo: EmailRepo,
        private readonly emailEventHandler: EmailEventHandler,
    ) {}

    async getEmailAddressAndStatusForPerson(person: Person<true>): Promise<PersonEmailResponse | undefined> {
        const emailMicroserviceConfig: EmailMicroserviceConfig = this.configService.getOrThrow<EmailMicroserviceConfig>(
            'EMAIL_MICROSERVICE',
        );
        const useEmailMicroservice: boolean = emailMicroserviceConfig.USE_EMAIL_MICROSERVICE;
        const endpoint: string = emailMicroserviceConfig.ENDPOINT;
        return useEmailMicroservice
        ? this.findEmail(endpoint, person)
        : await this.emailRepo.getEmailAddressAndStatusForPerson(person);
    }

    async findEmail(endpoint: string, person: Person<true>): Promise<PersonEmailResponse | undefined> {
        try {
            const response: AxiosResponse<EmailAddressResponse[]> = await lastValueFrom(this.httpService.get(endpoint + `${person.id}`, { method: 'GET' }));
            if (response.data[0] !== undefined) {
                const status = this.mapStatus(response.data[0]?.status);
                return new PersonEmailResponse(status, response.data[0].address);
            }
            return undefined;
        } catch (error) {
            console.error(`Failed to fetch email for person ${person.id}`, error);
            return undefined;
        }
    }

    async setEmailAddressForPerson(person: PersonenkontextUpdatedPersonData, removedKontexte: PersonenkontextEventKontextData[]): Promise<void> {
        const emailMicroserviceConfig: EmailMicroserviceConfig = this.configService.getOrThrow<EmailMicroserviceConfig>(
            'EMAIL_MICROSERVICE',
        );
        const useEmailMicroservice: boolean = emailMicroserviceConfig.USE_EMAIL_MICROSERVICE;
        const endpoint: string = emailMicroserviceConfig.ENDPOINT;
        return useEmailMicroservice
        ? this.setEmail(endpoint, person)
        : await this.emailEventHandler.handlePersonenkontextUpdatedEvent(person, removedKontexte);
    }

    async setEmail(endpoint: string, person: PersonenkontextUpdatedPersonData): Promise<void> {
        try {
            this.logger.info(`Handle PersonenkontextUpdatedEvent in new Microservice`);
            await lastValueFrom(this.httpService.post(endpoint + `write/set-email-for-person`, {
                spshPersonId: person.id,
                firstname: person.vorname,
                lastname: person.familienname,
                emailDomainId: person.email,
            }));
        } catch (error) {
            console.error(`Failed to set email for person ${person.id}`, error);
        }
    }

    mapStatus(ease: EmailAddressStatusEnum): EmailAddressStatus {
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
