import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

const ALLOWED_LOG_LEVEL: string[] = ['debug', 'info', 'warn', 'notice', 'warning', 'error', 'crit', 'alert', 'emerg'];

export class LoggingConfig {
    @IsNotEmpty()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly DEFAULT_LOG_LEVEL!: string;

    //Domain Modules
    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly PERSON_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly ORGANISATION_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly ROLLE_MODULE_LOG_LEVEL?: string;

    //API Modules

    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly PERSON_API_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly ROLLE_API_MODULE_LOG_LEVEL?: string;

    //Technical Modules
    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly SERVER_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly KEYCLOAK_ADMINISTRATION_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly HEALTH_MODULE_LOG_LEVEL?: string;

    //SPSH Modules
    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly BACKEND_FOR_FRONTEND_MODULE_LOG_LEVEL?: string;

    @IsOptional()
    @IsEnum(ALLOWED_LOG_LEVEL)
    public readonly UI_BACKEND_MODULE_LOG_LEVEL?: string;
}
