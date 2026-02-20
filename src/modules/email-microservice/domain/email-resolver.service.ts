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
import { SetEmailAddressForSpshPersonBodyParams } from '../../../email/modules/core/api/dtos/params/set-email-address-for-spsh-person.bodyparams.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';

export interface PersonIdWithEmailResponse {
    personId: string;
    personEmailResponse: PersonEmailResponse;
}

@Injectable()
export class EmailResolverService {
    private static readPath: string = 'api/read';
    private static writePath: string = 'api/write';

    public constructor(
        private readonly logger: ClassLogger,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {}

    public async findEmailBySpshPerson(personId: string): Promise<Option<PersonEmailResponse>> {
        try {
            const response: AxiosResponse<EmailAddressResponse[]> = await lastValueFrom(
                this.httpService.get(this.getEndpoint() + `${EmailResolverService.readPath}/spshperson/${personId}`, {
                    headers: {
                        'x-api-key': this.getApiKey(),
                    },
                }),
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

    public async findEmailBySpshPersonAsEmailAddressResponse(
        personId: string,
    ): Promise<Result<EmailAddressResponse | undefined, DomainError>> {
        try {
            const response: AxiosResponse<EmailAddressResponse[]> = await lastValueFrom(
                this.httpService.get(this.getEndpoint() + `${EmailResolverService.readPath}/spshperson/${personId}`, {
                    headers: {
                        'x-api-key': this.getApiKey(),
                    },
                }),
            );
            return Ok(response.data[0]);
        } catch (error) {
            this.logger.logUnknownAsError(`Failed to fetch email for person ${personId}`, error);
            return Err(new EntityNotFoundError('email-address', personId));
        }
    }

    public async findByPrimaryAddress(emailAddress: string): Promise<Option<PersonIdWithEmailResponse>> {
        try {
            const response: AxiosResponse<Option<EmailAddressResponse>> = await lastValueFrom(
                this.httpService.get(this.getEndpoint() + `${EmailResolverService.readPath}/email/${emailAddress}`, {
                    headers: {
                        'x-api-key': this.getApiKey(),
                    },
                }),
            );
            if (
                response.status === 200 &&
                response.data !== undefined &&
                response.data?.spshPersonId &&
                response.data.isPrimary
            ) {
                const status: EmailAddressStatus = this.mapStatus(response.data?.status);
                return {
                    personId: response.data.spshPersonId,
                    personEmailResponse: new PersonEmailResponse(status, response.data.address),
                };
            }
            return undefined;
        } catch (error) {
            this.logger.logUnknownAsError(`Failed to fetch email for address ${emailAddress}`, error);
            return undefined;
        }
    }

    public async setEmailForSpshPerson(params: {
        spshPersonId: string;
        spshUsername: string;
        kennungen: string[];
        firstName: string;
        lastName: string;
        spshServiceProviderId: string;
    }): Promise<void> {
        try {
            // For now just mocking the post
            this.logger.info(
                `Setting email for person ${params.spshPersonId} via email microservice with spId ${params.spshServiceProviderId}`,
            );
            this.logger.info(`Params: ${JSON.stringify(params)}`);
            await lastValueFrom(
                this.httpService.post(
                    this.getEndpoint() + `${EmailResolverService.writePath}/${params.spshPersonId}/set-email`,
                    {
                        spshUsername: params.spshUsername,
                        kennungen: params.kennungen,
                        firstName: params.firstName,
                        lastName: params.lastName,
                        spshServiceProviderId: params.spshServiceProviderId,
                    } satisfies SetEmailAddressForSpshPersonBodyParams,
                    {
                        headers: {
                            'x-api-key': this.getApiKey(),
                        },
                    },
                ),
            );
        } catch (error) {
            this.logger.logUnknownAsError(`Failed to set email for person ${params.spshPersonId}`, error);
        }
    }

    public async deleteEmailsForSpshPerson(params: { spshPersonId: string }): Promise<void> {
        try {
            this.logger.info(`Deleting email for person ${params.spshPersonId} via email microservice`);
            await lastValueFrom(
                this.httpService.delete(
                    this.getEndpoint() + `${EmailResolverService.writePath}/${params.spshPersonId}/delete-emails`,
                    {
                        headers: {
                            'x-api-key': this.getApiKey(),
                        },
                    },
                ),
            );
        } catch (error) {
            this.logger.logUnknownAsError(`Failed to delete emails for person ${params.spshPersonId}`, error);
        }
    }

    public async setEmailsSuspendedForSpshPerson(params: { spshPersonId: string }): Promise<void> {
        try {
            this.logger.info(`Setting emails for person ${params.spshPersonId} to suspended`);
            await lastValueFrom(
                this.httpService.post(
                    this.getEndpoint() + `${EmailResolverService.writePath}/${params.spshPersonId}/set-suspended`,
                    {
                        headers: {
                            'x-api-key': this.getApiKey(),
                        },
                    },
                ),
            );
        } catch (error) {
            this.logger.logUnknownAsError(`Failed to set emails for person ${params.spshPersonId} to suspended`, error);
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

    private getApiKey(): string {
        const emailMicroserviceConfig: EmailMicroserviceConfig =
            this.configService.getOrThrow<EmailMicroserviceConfig>('EMAIL_MICROSERVICE');
        return emailMicroserviceConfig.API_KEY;
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
