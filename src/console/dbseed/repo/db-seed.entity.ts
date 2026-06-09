import { BaseEntity, DateTimeType, Opt } from '@mikro-orm/core';
import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

export enum DbSeedStatus {
    STARTED = 'STARTED',
    DONE = 'DONE',
    FAILED = 'FAILED',
}

@Entity({ tableName: 'seeding' })
export class DbSeedEntity extends BaseEntity {
    @PrimaryKey({ name: 'hash' })
    public hash!: string;

    @Enum({ items: () => DbSeedStatus, nativeEnumName: 'db_seed_status_enum' })
    public status!: DbSeedStatus;

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly executedAt!: Date & Opt;

    @Property({ nullable: true })
    public path?: string;
}
