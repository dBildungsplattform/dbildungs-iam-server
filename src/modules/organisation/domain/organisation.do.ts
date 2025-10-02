import { DoBase } from '../../../shared/types/index.js';
import { OrganisationsTyp, Traegerschaft } from './organisation.enums.js';

export class OrganisationDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    public constructor() {}

    public id!: Persisted<string, WasPersisted>;

    public createdAt!: Persisted<Date, WasPersisted>;

    public updatedAt!: Persisted<Date, WasPersisted>;

    public administriertVon?: string;

    public zugehoerigZu?: string;

    public kennung?: string;

    public name?: string;

    public namensergaenzung?: string;

    public kuerzel?: string;

    public typ?: OrganisationsTyp;

    public traegerschaft?: Traegerschaft;
}
