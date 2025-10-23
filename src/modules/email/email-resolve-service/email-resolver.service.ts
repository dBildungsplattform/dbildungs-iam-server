import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonEmailResponse } from '../../person/api/person-email-response.js';
import { Person } from '../../person/domain/person.js';
import { EmailMicroserviceConfig } from '../../../shared/config/email-microservice.config.js';
import { HttpService } from '@nestjs/axios';
import { first, last, lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { EmailAddressResponse } from '../../../email/modules/core/api/dtos/response/email-address.response.js';
import { EmailAddressStatusEnum } from '../../../email/modules/core/persistence/email-address-status.entity.js';
import { EmailAddressStatus } from '../domain/email-address.js';

@Injectable()
export class EmailResolverService {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly emailRepo: EmailRepo,
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

    async setEmailAddressForPerson(person: Person<true>, email: string): Promise<void> {
        const emailMicroserviceConfig: EmailMicroserviceConfig = this.configService.getOrThrow<EmailMicroserviceConfig>(
            'EMAIL_MICROSERVICE',
        );
        const useEmailMicroservice: boolean = emailMicroserviceConfig.USE_EMAIL_MICROSERVICE;
        const endpoint: string = emailMicroserviceConfig.ENDPOINT;
        return useEmailMicroservice
        ? this.setEmail(endpoint, person, email)
        : await this.emailRepo.setEmailAddressForPerson(person, email);
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

    async setEmail(endpoint: string, person: Person<true>, email: string): Promise<void> {
        try {
            await lastValueFrom(this.httpService.post(endpoint + `write/set-email-for-person`, {
                spshPersonId: person.id,
                firstname: person.vorname,
                lastname: person.familienname,
                emailDomainId: email,
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
