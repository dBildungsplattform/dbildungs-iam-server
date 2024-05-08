import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { OrganisationSpecificationError } from '../specification/error/organisation-specification.error.js';
import { KennungRequiredForSchuleError } from '../specification/error/kennung-required-for-schule.error.js';
import { SchuleUnterTraegerError } from '../specification/error/schule-unter-traeger.error.js';
import { TraegerInTraegerError } from '../specification/error/traeger-in-traeger.error.js';
import { NurKlasseKursUnterSchuleError } from '../specification/error/nur-klasse-kurs-unter-schule.error.js';
import { ZyklusInOrganisationenError } from '../specification/error/zyklus-in-organisationen.error.js';
import { RootOrganisationImmutableError } from '../specification/error/root-organisation-immutable.error.js';
import { KlasseNurVonSchuleAdministriertError } from '../specification/error/klasse-nur-von-schule-administriert.error.js';
import { KlassenNameAnSchuleEindeutigError } from '../specification/error/klassen-name-an-schule-eindeutig.error.js';
import { DbiamOrganisationError, OrganisationSpecificationErrorI18nTypes } from './dbiam-organisation.error.js';

@Catch(OrganisationSpecificationError)
export class OrganisationExceptionFilter implements ExceptionFilter<OrganisationSpecificationError> {
    private ERROR_MAPPINGS: Map<string, DbiamOrganisationError> = new Map([
        [
            KennungRequiredForSchuleError.name,
            new DbiamOrganisationError({
                code: 400,
                i18nKey: OrganisationSpecificationErrorI18nTypes.KENNUNG_REQUIRED_FOR_SCHULE,
                titel: 'Fehlerhafte Anfrage',
                beschreibung: 'Das Feld kennung darf nicht leer sein, wenn der Organisationstyp SCHULE ist.',
            }),
        ],
        [
            SchuleUnterTraegerError.name,
            new DbiamOrganisationError({
                code: 400,
                i18nKey: OrganisationSpecificationErrorI18nTypes.SCHULE_UNTER_TRAEGER,
                titel: 'Spezifikation von Organisation nicht erfüllt',
                beschreibung: 'Schulen können nur Trägern zugeordnet / von Trägern administriert werden.',
            }),
        ],
        [
            TraegerInTraegerError.name,
            new DbiamOrganisationError({
                code: 400,
                i18nKey: OrganisationSpecificationErrorI18nTypes.TRAEGER_IN_TRAEGER,
                titel: 'Spezifikation von Organisation nicht erfüllt',
                beschreibung: 'Träger können nur Trägern zugeordnet / von diesen administriert werden.',
            }),
        ],
        [
            NurKlasseKursUnterSchuleError.name,
            new DbiamOrganisationError({
                code: 400,
                i18nKey: OrganisationSpecificationErrorI18nTypes.NUR_KLASSE_UNTER_SCHULE,
                titel: 'Spezifikation von Organisation nicht erfüllt',
                beschreibung: 'Nur Klassen und Kurse können zugehörig sein oder administriert werden von Schulen.',
            }),
        ],
        [
            ZyklusInOrganisationenError.name,
            new DbiamOrganisationError({
                code: 400,
                i18nKey: OrganisationSpecificationErrorI18nTypes.ZYKLUS_IN_ORGANISATION,
                titel: 'Spezifikation von Organisation nicht erfüllt',
                beschreibung:
                    'Die administriertVon- oder zugehörigZu-Beziehung kann nicht erstellt werden, da keine Zyklen erlaubt sind.',
            }),
        ],
        [
            RootOrganisationImmutableError.name,
            new DbiamOrganisationError({
                code: 400,
                i18nKey: OrganisationSpecificationErrorI18nTypes.ROOT_ORGANISATION_IMMUTABLE,
                titel: 'Spezifikation von Organisation nicht erfüllt',
                beschreibung: 'Die Root-Organisation ist bzgl. administriertVon und zugehörigZu unveränderlich.',
            }),
        ],
        [
            KlasseNurVonSchuleAdministriertError.name,
            new DbiamOrganisationError({
                code: 400,
                i18nKey: OrganisationSpecificationErrorI18nTypes.KLASSE_NUR_VON_SCHULE_ADMINISTRIERT,
                titel: 'Spezifikation von Organisation nicht erfüllt',
                beschreibung: 'Eine Klasse kann nur von einer Schule administriert werden.',
            }),
        ],
        [
            KlassenNameAnSchuleEindeutigError.name,
            new DbiamOrganisationError({
                code: 400,
                i18nKey: OrganisationSpecificationErrorI18nTypes.KLASSEN_NAME_AN_SCHULE_EINDEUTIG,
                titel: 'Spezifikation von Organisation nicht erfüllt',
                beschreibung: 'Der Klassen-Name muss pro Schule eindeutig sein.',
            }),
        ],
    ]);

    public catch(exception: OrganisationSpecificationError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const status: number = 400; //all errors regarding organisation specifications are BadRequests

        const dbiamOrganisationError: DbiamOrganisationError = this.mapDomainErrorToDbiamError(exception);

        response.status(status);
        response.json(dbiamOrganisationError);
    }
    /*
    private mapDbiamErrorToHttpException(error: OrganisationSpecificationError): HttpException {
        return new HttpException(error, 400);
    }*/

    private mapDomainErrorToDbiamError(error: OrganisationSpecificationError): DbiamOrganisationError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamOrganisationError({
                code: 500,
                i18nKey: OrganisationSpecificationErrorI18nTypes.ORGANISATION_SPECIFICATION_ERROR,
                titel: 'Spezifikation von Organisation nicht erfüllt',
                beschreibung:
                    'Eine Spezifikation für eine Organisation wurde nicht erfüllt, der Fehler konnte jedoch nicht zugeordnet werden.',
            })
        );
    }
}
