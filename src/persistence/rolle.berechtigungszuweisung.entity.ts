import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { RolleRechtEntity } from './rolle-recht.entity.js';

@Entity({ tableName: 'rolle_berechtigungszuweisung' })
export class RolleBerechtigungszuweisungEntity extends TimestampedEntity<RolleBerechtigungszuweisungEntity, 'id'> {
    @Property()
    public validForOrganisationalChildren!: boolean;

    @Property()
    public validForAdministrativeParents!: boolean;

    @ManyToOne()
    public rolePermission!: RolleRechtEntity;

    /**
     * Points to Schulstrukturknoten
     */
    @Property()
    public schulstrukturknoten!: string;
}
