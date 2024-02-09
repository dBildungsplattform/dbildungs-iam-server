import { Converter } from '@automapper/core';
import { RolleRechtEntity } from '../../service-provider/entity/rolle-recht.entity.js';
import { RolleRechtDo } from '../../service-provider/domain/rolle-recht.do.js';
import { ServiceProviderZugriffDo } from '../../service-provider/domain/service-provider-zugriff.do.js';
import { ServiceProviderZugriffEntity } from '../../service-provider/entity/service-provider-zugriff.entity.js';

export class ServiceProviderZugriffDoRolleRechtEntityConverter
    implements Converter<RolleRechtDo<boolean>, RolleRechtEntity>
{
    public convert(source: RolleRechtDo<boolean>): RolleRechtEntity {
        if (source instanceof ServiceProviderZugriffDo) {
            const spzEntity: Partial<ServiceProviderZugriffEntity> = {
                serviceProvider: source.serviceProvider,
            };
            return Object.assign(new ServiceProviderZugriffEntity(), spzEntity);
        }
        const spzEntity: Partial<RolleRechtEntity> = {};
        return Object.assign(new RolleRechtEntity(), spzEntity);
    }
}
