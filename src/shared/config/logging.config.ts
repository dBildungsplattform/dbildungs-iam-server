import { IsNotEmpty, IsString } from 'class-validator';

export class LoggingConfig {

  @IsString()
  @IsNotEmpty()
  public readonly DEFAULT_LOG_LEVEL!: string;

  //Domain Modules

  @IsString()
  @IsNotEmpty()
  public readonly PERSON_LOG_LEVEL!: string;

  @IsString()
  @IsNotEmpty()
  public readonly ORGANISATION_LOG_LEVEL!: string;

  @IsString()
  @IsNotEmpty()
  public readonly ROLLE_LOG_LEVEL!: string;

  //Technical Modules

  @IsString()
  @IsNotEmpty()
  public readonly KEYCLOAK_LOG_LEVEL!: string;

  //SPSH Modules

  @IsString()
  @IsNotEmpty()
  public readonly BACKEND_FOR_FRONTEND_LOG_LEVEL!: string;

  @IsString()
  @IsNotEmpty()
  public readonly UI_BACKEND_LOG_LEVEL!: string;

}
