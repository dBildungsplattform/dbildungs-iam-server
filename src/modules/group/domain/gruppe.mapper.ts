import { Injectable } from '@nestjs/common';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { Gruppe } from './gruppe.js';
import { ReferenzgruppeEntity } from '../persistence/referenzgruppe.entity.js';
@Injectable()
export class GruppeMapper {
    public mapGruppeToGruppeEntity(gruppe: Gruppe<false>): GruppeEntity {
        const gruppeEntity: GruppeEntity = new GruppeEntity({
            mandant: gruppe.mandant,
            organisationId: gruppe.organisationId,
            referrer: gruppe.referrer,
            bezeichnung: gruppe.bezeichnung,
            thema: gruppe.thema,
            beschreibung: gruppe.beschreibung,
            typ: gruppe.typ,
            bereich: gruppe.bereich,
            optionen: gruppe.optionen,
            differenzierung: gruppe.differenzierung,
            bildungsziele: gruppe.bildungsziele,
            jahrgangsstufen: gruppe.jahrgangsstufen,
            faecher: gruppe.faecher,
            referenzgruppen: [], // TODO: find a way to map referenzgruppen.
            laufzeit: gruppe.laufzeit,
        });
        return gruppeEntity;
    }

    public mapGruppeEntityToGruppe(entity: GruppeEntity): Gruppe<true> {
        return Gruppe.construct(
            entity.id,
            entity.createdAt,
            entity.updatedAt,
            entity.bezeichnung,
            entity.typ,
            entity.revision,
            entity.referrer,
            entity.thema,
            entity.beschreibung,
            entity.bereich,
            entity.optionen,
            entity.differenzierung,
            entity.bildungsziele,
            entity.jahrgangsstufen,
            entity.faecher,
            entity.referenzgruppen?.map((referenzgruppe: ReferenzgruppeEntity) => referenzgruppe.referengruppeId) ?? [],
            [], // TODO: add prop Gruppenrollen to Gruppe
            entity.laufzeit,
        );
    }

    public getReferenzgruppenFromGruppeAggregate(gruppe: Gruppe<false>): ReferenzgruppeEntity[] {
        return (
            gruppe.referenzgruppenIds?.map((id: string, index: number) => {
                return new ReferenzgruppeEntity({
                    referengruppeId: id,
                    rollen: gruppe.referenzgruppenRollen?.[index],
                });
            }) ?? []
        );
    }
}
