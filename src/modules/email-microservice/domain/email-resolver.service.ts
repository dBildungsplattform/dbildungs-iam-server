import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailAddressResponse } from '../../../email/modules/core/api/dtos/response/email-address.response.js';
import { EmailAddressStatusEnum } from '../../../email/modules/core/persistence/email-address-status.entity.js';
import { EmailMicroserviceConfig } from '../../../shared/config/email-microservice.config.js';
import { PersonEmailResponse } from '../../person/api/person-email-response.js';
import { EmailAddressStatus } from '../../email/domain/email-address.js';

@Injectable()
export class EmailResolverService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {}

    public async findEmailBySpshPerson(personId: string): Promise<PersonEmailResponse | undefined> {
        try {
            const response: AxiosResponse<EmailAddressResponse[]> = await lastValueFrom(
                this.httpService.get(this.getEndpoint() + `api/read/${personId}`),
            );
            if (response.data[0] !== undefined) {
                const status: EmailAddressStatus = this.mapStatus(response.data[0]?.status);
                return new PersonEmailResponse(status, response.data[0].address);
            }
            return undefined;
        } catch (error) {
            this.logger.logUnknownAsError(`Failed to fetch email for person ${personId}`, error);
            return undefined;
        }
    }

    public async setEmailForSpshPerson(params: {
        spshPersonId: string;
        firstName: string;
        lastName: string;
        spshServiceProviderId: string;
    }): Promise<void> {
        try {
            // For now just mocking the post
            this.logger.info(
                `Setting email for person ${params.spshPersonId} via email microservice with spId ${params.spshServiceProviderId}`,
            );
            await lastValueFrom(
                this.httpService.post(this.getEndpoint() + `api/write/set-email-for-person`, {
                    spshPersonId: params.spshPersonId,
                    firstName: params.firstName,
                    lastName: params.lastName,
                    spshServiceProviderId: params.spshServiceProviderId,
                }),
            );
        } catch (error) {
            this.logger.logUnknownAsError(`Failed to set email for person ${params.spshPersonId}`, error);
        }
    }

    public shouldUseEmailMicroservice(): boolean {
        const emailMicroserviceConfig: EmailMicroserviceConfig =
            this.configService.getOrThrow<EmailMicroserviceConfig>('EMAIL_MICROSERVICE');
        return emailMicroserviceConfig.USE_EMAIL_MICROSERVICE;
    }

    // ==== Helper functions ====

    private getEndpoint(): string {
        const emailMicroserviceConfig: EmailMicroserviceConfig =
            this.configService.getOrThrow<EmailMicroserviceConfig>('EMAIL_MICROSERVICE');
        return emailMicroserviceConfig.ENDPOINT;
    }

    private mapStatus(ease: EmailAddressStatusEnum): EmailAddressStatus {
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
                eas = EmailAddressStatus.DISABLED;
                break;
            case EmailAddressStatusEnum.TO_BE_DELETED:
                eas = EmailAddressStatus.DELETED;
                break;
            default:
                eas = EmailAddressStatus.DISABLED;
        }
        return eas;
    }
}
