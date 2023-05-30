import { ValidationPipe } from "@nestjs/common";

/** *********************************************
 * Global Pipe setup
 * **********************************************
 * Validation of DTOs will base on type-checking
 * which is enabled by default. To you might use
 * the class-validator decorators to extend
 * validation.
 */
export class GlobalValidationPipe extends ValidationPipe {
    public constructor() {
        super({
            // enable DTO instance creation for incoming data
            transform: true,
            transformOptions: {
                // enable type coercion, requires transform:true
                enableImplicitConversion: true,
            },
            whitelist: true, // only pass valid @ApiProperty-decorated DTO properties, remove others
            forbidNonWhitelisted: false, // additional params are just skipped (required when extracting multiple DTO from single query)
            forbidUnknownValues: true,
            // TODO: create types for the exception factory
            // exceptionFactory: (errors: ValidationError[]) => new ApiValidationError(errors),
        });
    }
}
