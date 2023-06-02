import { BaseEntity, PrimaryKey, Property } from "@mikro-orm/core";

export abstract class EntityBase extends BaseEntity<EntityBase, "id"> {
    @PrimaryKey()
    public readonly id!: string;

    @Property()
    public readonly createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    public readonly updatedAt: Date = new Date();
}
