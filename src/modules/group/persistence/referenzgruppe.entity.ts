import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Gruppenrollen } from '../domain/gruppe.enums.js';
import { GruppeEntity } from './gruppe.entity.js';

export type ReferenzgruppeProps = Omit<ReferenzgruppeEntity, keyof TimestampedEntity>;

@Entity({ tableName: 'referenzgruppen' })
export class ReferenzgruppeEntity extends TimestampedEntity {
    public constructor(props: ReferenzgruppeProps) {
        super();
        Object.assign(this, props);
    }

    @Property({ nullable: true })
    public referengruppeId!: string;

    @Enum({ items: () => Gruppenrollen, nullable: true, array: true })
    public rollen?: Gruppenrollen[];

    @ManyToOne()
    public gruppe?: GruppeEntity;
}
