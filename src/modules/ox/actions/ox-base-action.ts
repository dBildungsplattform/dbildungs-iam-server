import { XMLBuilder, XMLParser } from 'fast-xml-parser';

import { DomainError } from '../../../shared/error/index.js';
import { OxError } from '../../../shared/error/ox.error.js';

export type OXRequestStatus =
    | {
          code: 'success';
      }
    | {
          code: 'failure';
      };
export type AuthParams = {
    login: string;
    password: string;
};

export type OxBaseResponse<BodyResponse> = {
    Envelope: {
        Body: BodyResponse;
    };
};

export type OxErrorResponse = {
    Envelope: {
        Body: {
            Fault: {
                faultcode: string;
                faultstring: string;
            };
        };
    };
};

export abstract class OxBaseAction<ResponseBodyType, ResultType> {
    protected readonly xmlBuilder: XMLBuilder = new XMLBuilder({ ignoreAttributes: false });

    protected readonly xmlParser: XMLParser = new XMLParser({
        ignoreAttributes: false,
        removeNSPrefix: true,
        isArray: (tagName: string, jPath: string, isLeafNode: boolean, isAttribute: boolean) =>
            this.isArrayOverride(tagName, jPath, isLeafNode, isAttribute),
    });

    public abstract action: string;

    public abstract soapServiceName: string;

    public abstract buildRequest(): object;

    // Customize parsing behaviour, see X2jOptions.isArray
    public isArrayOverride(_tagName: string, _jPath: string, _isLeafNode: boolean, _isAttribute: boolean): boolean {
        return false;
    }

    /**
     * Will be called if the response was successful
     * @param body The contents of the response body
     */
    public abstract parseBody(body: ResponseBodyType): Result<ResultType, DomainError>;

    public parseResponse(input: string): Result<ResultType, DomainError> {
        const result: OxBaseResponse<ResponseBodyType> = this.xmlParser.parse(
            input,
        ) as OxBaseResponse<ResponseBodyType>;
        const errorResult: OxErrorResponse = this.xmlParser.parse(input) as OxErrorResponse;

        if (errorResult.Envelope.Body.Fault) {
            return {
                ok: false,
                error: new OxError('Request failed', result),
            };
        } else {
            return this.parseBody(result.Envelope.Body);
        }
    }
}