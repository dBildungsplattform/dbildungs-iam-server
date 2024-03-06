import { Injectable } from '@nestjs/common';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { Gruppe } from './gruppe.js';
@Injectable()
export class GruppeMapper {
    public mapGruppeToGruppeEntity(gruppe: Gruppe<false>): GruppeEntity {
        const gruppeEntity: GruppeEntity = new GruppeEntity();
        gruppeEntity.mandant = gruppe.getMandant();
        gruppeEntity.organisationId = gruppe.getOrganisationId();
        gruppeEntity.referrer = gruppe.getReferrer();
        gruppeEntity.bezeichnung = gruppe.getBezeichnung();
        gruppeEntity.thema = gruppe.getThema();
        gruppeEntity.beschreibung = gruppe.getBeschreibung();
        gruppeEntity.typ = gruppe.getTyp();
        gruppeEntity.bereich = gruppe.getBereich();
        gruppeEntity.optionen = gruppe.getOptionen();
        gruppeEntity.differenzierung = gruppe.getDifferenzierung();
        gruppeEntity.bildungsziele = gruppe.getBildungsziele();
        gruppeEntity.jahrgangsstufen = gruppe.getJahrgangsstufen();
        gruppeEntity.faecher = gruppe.getFaecher();
        gruppeEntity.referenzgruppen = gruppe.getReferenzgruppen();
        gruppeEntity.laufzeit = gruppe.getLaufzeit();
        return gruppeEntity;
    }

    public mapGruppeEntityToGruppe(entity: GruppeEntity): Gruppe<true> {
        return Gruppe.construct(
            entity.id,
            entity.createdAt,
            entity.updatedAt,
            entity.mandant,
            entity.organisationId,
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
