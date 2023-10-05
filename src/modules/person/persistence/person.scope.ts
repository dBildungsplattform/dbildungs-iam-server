/* eslint-disable @typescript-eslint/explicit-member-accessibility */

// TODO should Refactor with german
import { Scope } from '../../../shared/repo/scope.js';
import { PersonEntity } from './person.entity.js';
export class PersonScope extends Scope<PersonEntity> {
    byFirstName(firstName: string | undefined): this {
        if (firstName) {
            this.addQuery({ firstName: { $re: firstName } });
        }
        return this;
    }

    byLastName(lastName: string | undefined): this {
        if (lastName) {
            this.addQuery({ lastName: { $re: lastName } });
        }
        return this;
    }

    byBirthDate(birthDate: Date | undefined): this {
        if (birthDate) {
            this.addQuery({ birthDate });
        }
        return this;
    }

    /* byBirthPlace(birthPlace: string | undefined): this {
        if (birthPlace) {
            this.addQuery({ birthPlace });
        }
        return this;
    } */
}
