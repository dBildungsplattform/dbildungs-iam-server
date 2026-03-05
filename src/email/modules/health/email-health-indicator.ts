import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailHealthIndicator extends HealthIndicator {
    public constructor() {
        super();
    }

    public check(): HealthIndicatorResult {
        const HealthCheckKey: string = 'Email';

        try {
            return super.getStatus(HealthCheckKey, true);
        } catch (e: unknown) {
            let statusMessage: string = `EmailApp does not seem to be up and there is no error message available`;
            /* v8 ignore else  @preserve */
            if (e instanceof Error) {
                statusMessage = `EmailApp does not seem to be up: ${e.message}`;
            }
            return super.getStatus(HealthCheckKey, false, { message: statusMessage });
        }
    }
}
