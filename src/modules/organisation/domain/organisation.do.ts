import { AutoMap } from '@automapper/classes';
import { DoBase } from '../../../shared/types/index.js';
import { OrganisationsTyp, Traegerschaft } from './organisation.enums.js';

export class OrganisationDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    public constructor() {}

    @AutoMap(() => String)
    public id!: Persisted<string, WasPersisted>;

    @AutoMap(() => Date)
    public createdAt!: Persisted<Date, WasPersisted>;

    @AutoMap(() => Date)
    public updatedAt!: Persisted<Date, WasPersisted>;

    @AutoMap()
    public verwaltetVon?: string;

    @AutoMap()
    public zugehoerigZu?: string;

    @AutoMap()
    public kennung?: string;

    @AutoMap()
    public name?: string;

    @AutoMap()
    public namensergaenzung?: string;

    @AutoMap()
    public kuerzel?: string;

    @AutoMap(() => String)
    public typ?: OrganisationsTyp;

    @AutoMap(() => String)
    public traegerschaft?: Traegerschaft;
}
