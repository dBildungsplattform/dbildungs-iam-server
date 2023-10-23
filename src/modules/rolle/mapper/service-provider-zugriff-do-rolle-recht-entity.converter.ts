import { Converter } from '@automapper/core';
import { RolleRechtEntity } from '../entity/rolle-recht.entity.js';
import { RolleRechtDo } from '../domain/rolle-recht.do.js';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { ServiceProviderZugriffEntity } from '../entity/service-provider-zugriff.entity.js';

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
