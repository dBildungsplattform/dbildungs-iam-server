import { BaseEntity, DateTimeType, Entity, Enum, Opt, PrimaryKey, Property } from '@mikro-orm/core';

export enum DbSeedStatus {
    STARTED = 'STARTED',
    DONE = 'DONE',
    FAILED = 'FAILED',
}

@Entity({ tableName: 'seeding' })
export class DbSeedEntity extends BaseEntity {
    @PrimaryKey()
    public id!: string;

    @Enum(() => DbSeedStatus)
    public status!: DbSeedStatus;

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly executedAt!: Date & Opt;
}
