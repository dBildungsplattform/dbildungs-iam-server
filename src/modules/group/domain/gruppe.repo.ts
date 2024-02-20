import { Injectable } from '@nestjs/common';
import { Gruppe } from './gruppe.js';
import { EntityManager } from '@mikro-orm/postgresql';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
@Injectable()
export class GruppenRepository {
    public constructor(private readonly em: EntityManager) {}

    public async createGruppe(gruppe: Gruppe): Promise<void> {
        return this.em.persistAndFlush(this.mapGruppeToGruppeEntity(gruppe));
    }

    private mapGruppeToGruppeEntity(gruppe: Gruppe): GruppeEntity {
        // map Gruppe to GruppeEntity
        const gruppeEntity: GruppeEntity = new GruppeEntity();
        gruppeEntity.mandant = 'test-mandant';
        gruppeEntity.orgid = 'test-orgid';
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
        // gruppeEntity.laufzeit = gruppe.getLaufzeit();
        return gruppeEntity;
    }
}
