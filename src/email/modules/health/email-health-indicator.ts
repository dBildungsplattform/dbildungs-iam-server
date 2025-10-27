import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { EmailAddressResponse } from '../core/api/dtos/response/email-address.response.js';
import util from 'util';
import { HttpService } from '@nestjs/axios';
import { HostConfig } from '../../../shared/config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailHealthIndicator extends HealthIndicator {
    public constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {
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
            const port: number = this.configService.getOrThrow<HostConfig>('HOST').PORT;
            const response: AxiosResponse<EmailAddressResponse[]> = await firstValueFrom(
                this.httpService.get(`http://localhost:${port}/read`, {}),
            );
            return response.data;
        } catch (error: unknown) {
            throw new Error(`Failed retrieving email address ${util.inspect(error)}`);
        }
    }
}
