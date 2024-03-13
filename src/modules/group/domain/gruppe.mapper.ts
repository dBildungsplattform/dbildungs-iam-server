import { Injectable } from '@nestjs/common';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { Gruppe } from './gruppe.js';

@Injectable()
export class GruppeMapper {
    public mapGruppeToGruppeEntity(gruppe: Gruppe<false>): GruppeEntity {
        const gruppeEntity: GruppeEntity = new GruppeEntity();
        gruppeEntity.mandant = gruppe.mandant;
        gruppeEntity.organisationId = gruppe.organisationId;
        gruppeEntity.referrer = gruppe.referrer;
        gruppeEntity.bezeichnung = gruppe.bezeichnung;
        gruppeEntity.thema = gruppe.thema;
        gruppeEntity.beschreibung = gruppe.beschreibung;
        gruppeEntity.typ = gruppe.typ;
        gruppeEntity.bereich = gruppe.bereich;
        gruppeEntity.optionen = gruppe.optionen;
        gruppeEntity.differenzierung = gruppe.differenzierung;
        gruppeEntity.bildungsziele = gruppe.bildungsziele;
        gruppeEntity.jahrgangsstufen = gruppe.jahrgangsstufen;
        gruppeEntity.faecher = gruppe.faecher;
        gruppeEntity.referenzgruppen = gruppe.referenzgruppen;
        gruppeEntity.laufzeit = gruppe.laufzeit;

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
            entity.referenzgruppen,
            entity.laufzeit,
        );
    }
}
