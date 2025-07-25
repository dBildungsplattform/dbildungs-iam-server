import { XMLBuilder, XMLParser } from 'fast-xml-parser';

import { DomainError, ItsLearningError } from '../../../shared/error/index.js';
import { ItslearningAction } from '../types/action.types.js';

export type StatusInfo =
    | {
          codeMajor: 'failure';
          severity: 'error';
      }
    | {
          codeMajor: 'success';
          severity: 'status';
      };

export type BaseResponse<BodyResponse> = {
    Envelope: {
        Header: {
            syncResponseHeaderInfo: {
                statusInfo: StatusInfo;
            };
        };

        Body: BodyResponse;
    };
};

export abstract class IMSESAction<ResponseBodyType, ResultType> implements ItslearningAction<ResultType> {
    protected readonly xmlBuilder: XMLBuilder = new XMLBuilder({ ignoreAttributes: false });

    protected readonly xmlParser: XMLParser = new XMLParser({
        ignoreAttributes: false,
        removeNSPrefix: true,
        isArray: (tagName: string, jPath: string, isLeafNode: boolean, isAttribute: boolean) =>
            this.isArrayOverride(tagName, jPath, isLeafNode, isAttribute),
    });

    public abstract action: string;

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
        const result: BaseResponse<ResponseBodyType> = this.xmlParser.parse(input) as BaseResponse<ResponseBodyType>;

        if (result.Envelope.Header.syncResponseHeaderInfo.statusInfo.codeMajor === 'failure') {
            return {
                ok: false,
                error: new ItsLearningError('Request failed', result),
            };
        } else {
            return this.parseBody(result.Envelope.Body);
        }
    }
}
