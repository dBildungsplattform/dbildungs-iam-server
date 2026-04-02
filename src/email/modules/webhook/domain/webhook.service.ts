import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { retry, timer } from 'rxjs';

import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailAppConfig } from '../../../../shared/config/index.js';

import { EmailChangedBodyParams } from '../../../../modules/email-microservice/api/changed.body.params.js';

@Injectable()
export class WebhookService {
    private readonly endpoint: string;

    private readonly retries: number;

    private readonly delay: number;

    private readonly apiKey: string;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly httpService: HttpService,
        config: EmailAppConfig,
    ) {
        this.endpoint = config.WEBHOOK.ENDPOINT;
        this.retries = config.WEBHOOK.NUMBER_OF_RETRIES;
        this.delay = config.WEBHOOK.RETRY_DELAY;
        this.apiKey = config.HEADER_API_KEY.INTERNAL_COMMUNICATION_API_KEY;
    }

    public sendEmailsChanged({
        spshPersonId,
        previousPrimaryEmail,
        previousAlternativeEmail,
        newPrimaryEmail,
        newAlternativeEmail,
    }: EmailChangedBodyParams): void {
        this.httpService
            .post<void>(
                this.endpoint,
                {
                    spshPersonId,
                    previousPrimaryEmail,
                    previousAlternativeEmail,
                    newPrimaryEmail,
                    newAlternativeEmail,
                },
                {
                    headers: {
                        'api-key': this.apiKey,
                    },
                },
            )
            .pipe(
                retry({
                    count: this.retries,
                    delay: (error: AxiosError, retryCount: number) => {
                        const delay: number = this.delay;
                        this.logger.logUnknownAsWarning(
                            `Webhook notification for person ${spshPersonId} failed (Attempt #${retryCount}), retrying in ${delay}ms`,
                            error,
                        );
                        return timer(delay);
                    },
                }),
            )
            .subscribe({
                next: () => {
                    this.logger.info(`Webhook notification for person ${spshPersonId} was successful.`);
                },
                error: (err: AxiosError) => {
                    this.logger.logUnknownAsError(`Webhook notification for person ${spshPersonId} failed.`, err);
                },
            });
    }
}
