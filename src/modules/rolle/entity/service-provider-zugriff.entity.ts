import { Entity, Property } from '@mikro-orm/core';
import { RolleRechtEntity } from './rolle-recht.entity.js';
import { AutoMap } from '@automapper/classes';

@Entity({ discriminatorColumn: 'type', discriminatorValue: 'serviceProviderZugriff' })
export class ServiceProviderZugriffEntity extends RolleRechtEntity {
    /**
     * Points to service provider
     */
    @AutoMap()
    @Property()
    public serviceProvider!: string;
}
