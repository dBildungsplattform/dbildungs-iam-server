import { Entity, ManyToOne, Ref } from '@mikro-orm/core';

import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';

@Entity({
    expression: `
        WITH RECURSIVE
            expanded_rollenerweiterung AS (
                SELECT
                    re.rolle_id,
                    re.organisation_id,
                    re.service_provider_id
                FROM
                    public.rollenerweiterung re
                UNION ALL
                SELECT
                    exp.rolle_id,
                    o.id,
                    exp.service_provider_id
                FROM
                    expanded_rollenerweiterung exp
                    INNER JOIN public.organisation o ON o.administriert_von = exp.organisation_id
            )
        SELECT
            pk.id as personenkontext_id,
            ere.service_provider_id as service_provider_id
        FROM
            public.personenkontext pk
        INNER JOIN
            expanded_rollenerweiterung ere ON (pk.organisation_id = ere.organisation_id AND pk.rolle_id = ere.rolle_id)
    `,
})
export class PersonenkontextErweitertVirtualEntity {
    @ManyToOne(() => PersonenkontextEntity, { ref: true })
    public readonly personenkontext!: Ref<PersonenkontextEntity>;

    @ManyToOne(() => ServiceProviderEntity, { ref: true })
    public readonly serviceProvider!: Ref<ServiceProviderEntity>;
}
