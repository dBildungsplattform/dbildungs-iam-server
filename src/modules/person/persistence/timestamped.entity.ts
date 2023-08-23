import {BaseEntity, DateTimeType, Property} from "@mikro-orm/core";

export abstract class TimestampedEntity<Entity extends object, Primary extends keyof Entity, Populate extends string = string> extends BaseEntity<Entity, Primary, Populate> {
    @Property({ onCreate: () => new Date(), type: DateTimeType })
    public readonly createdAt!: Date;

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly updatedAt!: Date;
}
