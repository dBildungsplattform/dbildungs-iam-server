import { IsNotEmpty, IsString } from 'class-validator';

export class LoggingConfig{

  @IsString()
  @IsNotEmpty()
  public readonly PERSON_LOG_LEVEL;

  @IsString()
  @IsNotEmpty()
  public readonly ORGANISATION_LOG_LEVEL;

  @IsString()
  @IsNotEmpty()
  public readonly ROLLE_LOG_LEVEL;



}
