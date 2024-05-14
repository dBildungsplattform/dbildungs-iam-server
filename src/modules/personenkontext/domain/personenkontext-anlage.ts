import { Personenkontext } from './personenkontext.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonenkontextAnlageError } from '../../../shared/error/personenkontext-anlage.error.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { DBiamPersonenkontextService } from './dbiam-personenkontext.service.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';

export class PersonenkontextAnlage {
    public organisationId?: string;

    public rolleId?: string;

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepo,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personRepo: PersonRepo,
        private readonly dbiamPersonenkontextService: DBiamPersonenkontextService,
    ) {}

    public static createNew(
        rolleRepo: RolleRepo,
        organisationRepo: OrganisationRepo,
        dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        personRepo: PersonRepo,
        dbiamPersonenkontextService: DBiamPersonenkontextService,
    ): PersonenkontextAnlage {
        return new PersonenkontextAnlage(
            rolleRepo,
            organisationRepo,
            dBiamPersonenkontextRepo,
            personRepo,
            dbiamPersonenkontextService,
        );
    }

    // Function to filter organisations, so that only organisations are shown in "new user" dialog, which makes sense regarding the selected rolle.
    private organisationMatchesRollenart(organisation: OrganisationDo<true>, rolle: Rolle<true>): boolean {
        if (rolle.rollenart === RollenArt.SYSADMIN)
            return organisation.typ === OrganisationsTyp.LAND || organisation.typ === OrganisationsTyp.ROOT;
        if (rolle.rollenart === RollenArt.LEIT) return organisation.typ === OrganisationsTyp.SCHULE;
        if (rolle.rollenart === RollenArt.LERN)
            return organisation.typ === OrganisationsTyp.SCHULE || organisation.typ === OrganisationsTyp.KLASSE;
        if (rolle.rollenart === RollenArt.LEHR)
            return organisation.typ === OrganisationsTyp.SCHULE || organisation.typ === OrganisationsTyp.KLASSE;

        return true;
    }

    public async findSchulstrukturknoten(
        rolleId: string,
        sskName: string,
        limit?: number,
        excludeKlassen: boolean = false,
    ): Promise<OrganisationDo<true>[]> {
        this.rolleId = rolleId;

        const ssks: Option<OrganisationDo<true>[]> = await this.organisationRepo.findByNameOrKennung(sskName);
        if (ssks.length === 0) return [];

        const rolleResult: Option<Rolle<true>> = await this.rolleRepo.findById(rolleId);
        if (!rolleResult) return [];

        const allOrganisations: OrganisationDo<true>[] = [];

        const parentOrganisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(
            rolleResult.administeredBySchulstrukturknoten,
        );
        if (!parentOrganisation) return [];
        allOrganisations.push(parentOrganisation);

        const childOrganisations: OrganisationDo<true>[] = await this.organisationRepo.findChildOrgasForIds([
            rolleResult.administeredBySchulstrukturknoten,
        ]);
        allOrganisations.push(...childOrganisations);

        let orgas: OrganisationDo<true>[] = ssks.filter((ssk: OrganisationDo<true>) =>
            allOrganisations.some((organisation: OrganisationDo<true>) => ssk.id === organisation.id),
        );

        if (excludeKlassen) {
            orgas = orgas.filter((ssk: OrganisationDo<true>) => ssk.typ !== OrganisationsTyp.KLASSE);
        }

        orgas = orgas.filter((orga: OrganisationDo<true>) => this.organisationMatchesRollenart(orga, rolleResult));

        return orgas.slice(0, limit);
    }

    public async findRollen(rolleName: string, limit?: number): Promise<Rolle<true>[]> {
        const rollen: Option<Rolle<true>[]> = await this.rolleRepo.findByName(rolleName, limit);
        if (rollen) return rollen;
        return [];
    }

    //Phael:die wird nur von Tests verwendet, brauchen wir die?
    public async validieren(): Promise<Result<boolean, PersonenkontextAnlageError>> {
        if (!this.rolleId)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: rolleId is undefined'),
            };
        if (!this.organisationId)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: organisationId is undefined'),
            };

        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(this.rolleId);
        if (!rolle)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: rolle could not be found'),
            };
        const organisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(this.organisationId);
        if (!organisation)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: organisation could not be found'),
            };

        const rolleSSK: Option<OrganisationDo<true>> = await this.organisationRepo.findById(
            rolle.administeredBySchulstrukturknoten,
        );
        if (!rolleSSK)
            return {
                ok: false,
                error: new PersonenkontextAnlageError(
                    'PersonenkontextAnlage invalid: organisation administering rolle could not be found',
                ),
            };
        if (organisation.id == rolleSSK.id) return { ok: true, value: true };

        const children: OrganisationDo<true>[] = await this.organisationRepo.findChildOrgasForIds([rolleSSK.id]);
        if (children.some((c: OrganisationDo<true>) => c.id == organisation.id)) {
            return { ok: true, value: true };
        } else {
            return { ok: false, error: new EntityNotFoundError() };
        }
    }

    //Phael:die wird nur von Tests verwendet, brauchen wir die?
    public async zuweisen(personId: string): Promise<Result<Personenkontext<true>, PersonenkontextAnlageError>> {
        if (!this.rolleId)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: rolleId is undefined'),
            };
        if (!this.organisationId)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: organisationId is undefined'),
            };

        const isValid: Result<boolean, PersonenkontextAnlageError> = await this.validieren();
        if (!isValid.ok) return { ok: false, error: isValid.error };

        const personenkontext: Personenkontext<false> | DomainError = await Personenkontext.createNew(
            this.personRepo,
            this.organisationRepo,
            this.rolleRepo,
            this.dbiamPersonenkontextService,
            personId,
            this.organisationId,
            this.rolleId,
        );

        if (personenkontext instanceof DomainError) {
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid:' + personenkontext.message),
            };
        }

        const createdPersonenkontext: Personenkontext<true> = await this.dBiamPersonenkontextRepo.save(personenkontext);
        return { ok: true, value: createdPersonenkontext };
    }

    //TODO: die Methode organisationMatchesRollenart() für die Filterung verwenden
    public async findRollenArtBasedOnCurrentUserRollen(
        rolleIds: RolleID[],
        rollen: Rolle<true>[],
    ): Promise<Rolle<true>[]> {
        const ssks: OrganisationDo<true>[] = [];

        for (const rolleId of rolleIds) {
            ssks.concat(await this.findSchulstrukturknoten(rolleId, ''));
        }

        ssks.map((ssk: OrganisationDo<true>) => {
            console.log(ssk.name);
        });
        const organisationsTypes: (OrganisationsTyp | undefined)[] = ssks.map(
            (organisationDo: OrganisationDo<true>) => organisationDo.typ,
        );


        let rollenArten: RollenArt[] = [];
        const result: Rolle<true>[] = [];

        if ((organisationsTypes && organisationsTypes.includes(OrganisationsTyp.LAND)) ||
            organisationsTypes.includes(OrganisationsTyp.ROOT)) {
            rollenArten = [
                RollenArt.SYSADMIN,
                RollenArt.LEIT,
                RollenArt.ORGADMIN,
                RollenArt.EXTERN,
                RollenArt.LEHR,
                RollenArt.LERN,
            ];
        } else {
            if (organisationsTypes && organisationsTypes.includes(OrganisationsTyp.SCHULE))
                rollenArten = [RollenArt.LEIT, RollenArt.EXTERN, RollenArt.LEHR, RollenArt.LERN];
        }

        rollenArten.forEach(function (ra) {
            console.log(ra);
            const rolleFound: Rolle<true> | undefined = rollen.find((rolle: Rolle<true>) => rolle.rollenart === ra);
            if (rolleFound != undefined){
                console.log(rolleFound);
                result.push(rolleFound);
            }
        });

        return result;
    }
}
