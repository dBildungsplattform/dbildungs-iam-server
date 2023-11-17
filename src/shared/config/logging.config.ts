import { IsNotEmpty, IsString } from 'class-validator';

export class LoggingConfig {
    @IsString()
    @IsNotEmpty()
    public readonly DEFAULT_LOG_LEVEL!: string;

    //Domain Modules

    public readonly PERSONMODULE_LOG_LEVEL?: string;

    public readonly ORGANISATIONMODULE_LOG_LEVEL?: string;

    public readonly ROLLEMODULE_LOG_LEVEL?: string;

    //API Modules

    public readonly PERSONAPIMODULE_LOG_LEVEL?: string;

    public readonly ORGANISATIONAPIMODULE_LOG_LEVEL?: string;

    public readonly ROLLEAPIMODULE_LOG_LEVEL?: string;

    //Technical Modules

    public readonly KEYCLOAKADMINISTRATIONMODULE_LOG_LEVEL?: string;

    public readonly HEALTHMODULE_LOG_LEVEL?: string;

    //SPSH Modules

    public readonly BACKENDFORFRONTENDMODULE_LOG_LEVEL?: string;

    public readonly UIBACKENDMODULE_LOG_LEVEL?: string;
}
