import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { RolleEntity } from './rolle.entity.js';
import { AutoMap } from '@automapper/classes';
import { RolleRechtEntity } from './rolle-recht.entity.js';

@Entity({ tableName: 'rolle_berechtigungszuweisung' })
export class RolleBerechtigungsZuweisungEntity extends TimestampedEntity<RolleBerechtigungsZuweisungEntity, 'id'> {
    @AutoMap()
    @Property()
    public validForOrganisationalChildren!: boolean;

    @AutoMap()
    @Property()
    public validForAdministrativeParents!: boolean;

    @AutoMap(() => RolleRechtEntity)
    @ManyToOne()
    public rolleRecht!: RolleRechtEntity;

    @AutoMap(() => RolleEntity)
    @ManyToOne()
    public rolle!: RolleEntity;

    /**
     * Points to Schulstrukturknoten
     */
    @AutoMap()
    @Property()
    public schulstrukturknoten!: string;
}
