import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import util from 'util';
import { EmailAddressResponse } from '../api/email-address.response.js';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class EmailHealthIndicator extends HealthIndicator {
    public constructor(private readonly httpService: HttpService) {
        super();
    }

    public async check(): Promise<HealthIndicatorResult> {
        const HealthCheckKey: string = 'Email';

        try {
            await this.findEmailAddresses();
            return super.getStatus(HealthCheckKey, true);
        } catch (e: unknown) {
            let statusMessage: string = `EmailApp does not seem to be up and there is no error message available`;
            if (e instanceof Error) {
                statusMessage = `EmailApp does not seem to be up: ${e.message}`;
            }
            return super.getStatus(HealthCheckKey, false, { message: statusMessage });
        }
    }

    private async findEmailAddresses(): Promise<EmailAddressResponse[]> {
        try {
            const response: AxiosResponse<EmailAddressResponse[]> = await firstValueFrom(
                this.httpService.get('http://localhost:9090/read', {}),
            );
            return response.data;
        } catch (error: unknown) {
            throw new Error(`Failed retrieving email address ${util.inspect(error)}`);
        }
    }
}
