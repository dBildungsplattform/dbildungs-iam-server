import { OxError } from '../../../shared/error/ox.error.js';
import { OxErrorResponse } from '../actions/ox-base-action.js';
import { OxUsernameAlreadyExistsError } from '../error/ox-username-already-exists.error.js';
import { OxDisplaynameAlreadyUsedError } from '../error/ox-displayname-already-used.error.js';
import { OxPrimaryMailAlreadyExistsError } from '../error/ox-primary-mail-already-exists.error.js';
import { OxPrimaryMailNotEqualEmail1Error } from '../error/ox-primary-mail-not-equal-email1.error.js';

export class OxErrorMapper {
    public static mapOxErrorResponseToOxError(oxErrorResponse: OxErrorResponse): OxError {
        const faultString: string = oxErrorResponse.Envelope.Body.Fault.faultstring;

        const usernameAlreadyExistsRegex: RegExp =
            /^User [A-Za-z0-9]* already exists in this context; exceptionId [\w\d-]*/;
        const displaynameAlreadyUsedRegex: RegExp = /^The displayname is already used;[.]*/;
        const primaryMailAddressAlreadyExistsRegex: RegExp =
            /^Primary mail address \"[\w\d@\-\.]*\" already exists in context[.]*/;
        const primaryMailMustHaveSameValueAsEmail1Regex: RegExp =
            /^primarymail must have the same value as email1;[.]*/;
        if (usernameAlreadyExistsRegex.test(faultString)) return new OxUsernameAlreadyExistsError(faultString);
        if (displaynameAlreadyUsedRegex.test(faultString)) return new OxDisplaynameAlreadyUsedError(faultString);
        if (primaryMailAddressAlreadyExistsRegex.test(faultString))
            return new OxPrimaryMailAlreadyExistsError(faultString);
        if (primaryMailMustHaveSameValueAsEmail1Regex.test(faultString))
            return new OxPrimaryMailNotEqualEmail1Error(faultString);

        return new OxError();
    }
}
