import { assignSameKey } from '../../../shared/util/object-utils.js';
import { InvalidLogoCombinationError } from './errors/invalid-logo-combination.error.js';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from './service-provider.enum.js';

type SafeUpdateFields = Pick<ServiceProvider<boolean>, 'name' | 'url' | 'kategorie' | 'logoId'>;

export class ServiceProvider<WasPersisted extends boolean> {
    protected static readonly SAFE_UPDATE_FIELDS: (keyof SafeUpdateFields)[] = ['name', 'url', 'kategorie', 'logoId'];

    protected constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public name: string,
        public target: ServiceProviderTarget,
        public url: string | undefined,
        public kategorie: ServiceProviderKategorie,
        public providedOnSchulstrukturknoten: string,
        public logoId: number | undefined,
        public logo: Buffer | undefined,
        public logoMimeType: string | undefined,
        public keycloakGroup: string | undefined,
        public keycloakRole: string | undefined,
        public externalSystem: ServiceProviderSystem,
        public requires2fa: boolean,
        public vidisAngebotId: string | undefined,
        public merkmale: ServiceProviderMerkmal[],
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        target: ServiceProviderTarget,
        url: string | undefined,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logoId: number | undefined,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
        keycloakGroup: string | undefined,
        keycloakRole: string | undefined,
        externalSystem: ServiceProviderSystem,
        requires2fa: boolean,
        vidisAngebotId: string | undefined,
        merkmale: ServiceProviderMerkmal[],
    ): ServiceProvider<WasPersisted> {
        return new ServiceProvider(
            id,
            createdAt,
            updatedAt,
            name,
            target,
            url,
            kategorie,
            providedOnSchulstrukturknoten,
            logoId,
            logo,
            logoMimeType,
            keycloakGroup,
            keycloakRole,
            externalSystem,
            requires2fa,
            vidisAngebotId,
            merkmale,
        );
    }

    public static createNew(
        name: string,
        target: ServiceProviderTarget,
        url: string | undefined,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logoId: number | undefined,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
        keycloakGroup: string | undefined,
        keycloakRole: string | undefined,
        externalSystem: ServiceProviderSystem,
        requires2fa: boolean,
        vidisAngebotId: string | undefined,
        merkmale: ServiceProviderMerkmal[],
    ): ServiceProvider<false> {
        return new ServiceProvider(
            undefined,
            undefined,
            undefined,
            name,
            target,
            url,
            kategorie,
            providedOnSchulstrukturknoten,
            logoId,
            logo,
            logoMimeType,
            keycloakGroup,
            keycloakRole,
            externalSystem,
            requires2fa,
            vidisAngebotId,
            merkmale,
        );
    }

    /**
     * logoId can be set to null to clear it
     * @param update
     * @returns
     */
    public updateWithSafeFields(update: {
        name?: string;
        url?: string;
        kategorie?: ServiceProviderKategorie;
        logoId?: Option<number>;
    }): Option<InvalidLogoCombinationError> {
        if (!ServiceProvider.isValidLogoCombination(update.logoId, this.logo, this.logoMimeType)) {
            return new InvalidLogoCombinationError('Cannot set logoId, if there already is a logo');
        }
        for (const field of ServiceProvider.SAFE_UPDATE_FIELDS) {
            if (field === 'logoId' && update[field] === null) {
                this.logoId = undefined;
            } else if (update[field] !== undefined && update[field] !== null) {
                assignSameKey(this, update, field);
            }
        }
        return;
    }

    static isValidLogoCombination(logoId: Option<number>, logo: Option<Buffer>, logoMimeType: Option<string>): boolean {
        const logoIdProvided: boolean = logoId !== undefined && logoId !== null;
        const logoProvided: boolean =
            logo !== undefined && logo !== null && logoMimeType !== undefined && logoMimeType !== null;
        const validLogoIdCombination: boolean = logoIdProvided && !logoProvided;
        const validLogoDataCombination: boolean = !logoIdProvided && logoProvided;
        const noLogoCombination: boolean = !logoIdProvided && !logoProvided;
        return validLogoIdCombination || validLogoDataCombination || noLogoCombination;
    }
}
