import { Entity, Property } from '@mikro-orm/core';
import { RolleRechtEntity } from './rolle-recht.entity.js';

@Entity({ discriminatorColumn: 'type', discriminatorValue: 'serviceProviderZugriff' })
export class ServiceProviderZugriffEntity extends RolleRechtEntity {
    /**
     * Points to service provider
     */
    @Property()
    public serviceProvider!: string;
}
