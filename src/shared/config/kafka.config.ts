import { IsBoolean, IsNumber, IsString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class KafkaConfig {
  @IsString()
  public readonly BROKER!: string;

  @IsString()
  public readonly TOPIC_PREFIX!: string;

  @IsString()
  public readonly USER_TOPIC!: string;

  @IsString()
  public readonly USER_DLQ_TOPIC!: string;

  @IsString()
  public readonly GROUP_ID!: string;

  @Type(() => Number)
  @IsNumber()
  public readonly SESSION_TIMEOUT!: number;

  @Type(() => Number)
  @IsNumber()
  public readonly HEARTBEAT_INTERVAL!: number;

  @IsBoolean()
  public readonly ENABLED!: boolean;

  @IsBoolean()
  public readonly KAFKA_SSL_ENABLED!: boolean;

  @ValidateIf(o => o.KAFKA_SSL_ENABLED === true)
  @IsString()
  public readonly KAFKA_SSL_CA_PATH?: string;

  @ValidateIf(o => o.KAFKA_SSL_ENABLED === true)
  @IsString()
  public readonly KAFKA_SSL_CERT_PATH?: string;

  @ValidateIf(o => o.KAFKA_SSL_ENABLED === true)
  @IsString()
  public readonly KAFKA_SSL_KEY_PATH?: string;
}
