import { DbiamOrganisationError } from './dbiam-organisation.error.js';
import { DbiamErrorProps } from './dbiam.error.js';
import { DbiamRolleError } from './dbiam-rolle.error.js';

function getProps(): DbiamErrorProps {
    return {
        code: 0,
        subcode: '00',
        i18nKey: 'i18nKey-value',
        titel: 'Titel',
        beschreibung: 'Description',
    };
}
describe('DbiamErrror specific tests', () => {
    describe('DbiamOrganisationError', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const props: DbiamErrorProps = getProps();
                const error: DbiamOrganisationError = new DbiamOrganisationError(props);
                expect(error.code).toBe(props.code);
                expect(error.subcode).toBe(props.subcode);
                expect(error.i18nKey).toBe(props.i18nKey);
                expect(error.titel).toBe(props.titel);
                expect(error.beschreibung).toBe(props.beschreibung);
            });
        });
    });

    describe('DbiamRolleError', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const props: DbiamErrorProps = getProps();
                const error: DbiamRolleError = new DbiamRolleError(props);
                expect(error.code).toBe(props.code);
                expect(error.subcode).toBe(props.subcode);
                expect(error.i18nKey).toBe(props.i18nKey);
                expect(error.titel).toBe(props.titel);
                expect(error.beschreibung).toBe(props.beschreibung);
            });
        });
    });
});
