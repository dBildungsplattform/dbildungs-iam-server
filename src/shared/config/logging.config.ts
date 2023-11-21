import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoggingConfig {
    @IsString()
    @IsNotEmpty()
    public readonly DEFAULT_LOG_LEVEL!: string;

    //Domain Modules
    @IsOptional()
    @IsString()
    public readonly PERSON_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsString()
    public readonly ORGANISATION_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsString()
    public readonly ROLLE_MODULE_LOG_LEVEL?: string;

    //API Modules
    @IsOptional()
    @IsString()
    public readonly PERSON_API_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsString()
    public readonly ORGANISATION_API_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsString()
    public readonly ROLLE_API_MODULE_LOG_LEVEL?: string;

    //Technical Modules
    @IsOptional()
    @IsString()
    public readonly SERVER_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsString()
    public readonly KEYCLOAK_ADMINISTRATION_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsString()
    public readonly HEALTH_MODULE_LOG_LEVEL?: string;

    //SPSH Modules
    @IsOptional()
    @IsString()
    public readonly BACKEND_FOR_FRONTEND_MODULE_LOG_LEVEL?: string;

    @IsString()
    @IsOptional()
    public readonly UI_BACKEND_MODULE_LOG_LEVEL?: string;
}
