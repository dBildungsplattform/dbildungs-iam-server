import { Entity, Enum, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';

export enum MeldungStatus {
    VEROEFFENTLICHT = 'veroeffentlicht',
    NICHT_VEROEFFENTLICHT = 'nicht_veroeffentlicht',
}

@Entity({ tableName: 'meldung' })
export class MeldungEntity extends TimestampedEntity {
    public constructor() {
        super();
    }

    @Property({ length: 2000 })
    public inhalt!: string;

    @Enum({ items: () => MeldungStatus, default: MeldungStatus.NICHT_VEROEFFENTLICHT })
    public status!: MeldungStatus;

    @Property({ default: 1 })
    public version!: number;
}
