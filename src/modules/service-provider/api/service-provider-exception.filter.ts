import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ServiceProviderError } from '../specification/error/service-provider.error';

@Catch(ServiceProviderError)
export class ServiceProviderErrorFilter implements ExceptionFilter<ServiceProviderError> {
    public catch(exception: ServiceProviderError, host: ArgumentsHost): void {
        // TODO: Implement error handling logic, e.g., logging, transforming the error response, etc.
        throw new Error('ServiceProviderErrorFilter catch method not implemented.');
    }
}
