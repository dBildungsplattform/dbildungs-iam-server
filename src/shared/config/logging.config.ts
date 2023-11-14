import { IsNotEmpty, IsString } from 'class-validator';

export class LoggingConfig {

  @IsString()
  @IsNotEmpty()
  public readonly DEFAULT_LOG_LEVEL!: string;

  //Domain Modules

  @IsString()
  @IsNotEmpty()
  public readonly PERSONMODULE_LOG_LEVEL!: string;

  @IsString()
  @IsNotEmpty()
  public readonly ORGANISATIONMODULE_LOG_LEVEL!: string;

  @IsString()
  @IsNotEmpty()
  public readonly ROLLEMODULE_LOG_LEVEL!: string;

  //Technical Modules

  @IsString()
  @IsNotEmpty()
  public readonly KEYCLOAKMODULE_LOG_LEVEL!: string;

  //SPSH Modules

  @IsString()
  @IsNotEmpty()
  public readonly BACKENDFORFRONTENDMODULE_LOG_LEVEL!: string;

  @IsString()
  @IsNotEmpty()
  public readonly UIBACKENDMODULE_LOG_LEVEL!: string;

}
