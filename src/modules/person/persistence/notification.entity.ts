import {TimestampedEntity} from "./timestamped.entity";
import {Entity} from "@mikro-orm/core";

@Entity({tableName: "notification"})
export class NotificationEntity extends TimestampedEntity<NotificationEntity, 'id'> {
    public constructor() {
        super();
    }

    public readonly id!: string
}
