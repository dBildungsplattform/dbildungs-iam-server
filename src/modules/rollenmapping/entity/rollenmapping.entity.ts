import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Ref } from '@mikro-orm/core/entity/Reference.js';
import { RolleEntity } from '../../rolle/entity/rolle.entity.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';

@Entity({ tableName: 'rollenmapping' })
export class RollenMappingEntity extends TimestampedEntity {
    @ManyToOne({
        entity: () => RolleEntity,
        columnType: 'uuid',
        fieldName: 'rolle_id',
        ref: true,
        nullable: false,
    })
    public rolleId!: Ref<RolleEntity>;

    @ManyToOne({
        entity: () => ServiceProviderEntity,
        columnType: 'uuid',
        fieldName: 'service_provider_id',
        ref: true,
        nullable: false,
    })
    public serviceProviderId!: Ref<ServiceProviderEntity>;

    @Property()
    public mapToLmsRolle!: string;
}
