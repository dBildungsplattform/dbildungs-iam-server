import { XMLBuilder, XMLParser } from 'fast-xml-parser';

import { DomainError, ItsLearningError } from '../../../shared/error/index.js';

export type StatusInfo =
    | {
          codeMajor: 'failure';
          severity: 'error';
      }
    | {
          codeMajor: 'success';
          severity: 'status';
      };

export type BaseMassResponse<BodyResponse> = {
    Envelope: {
        Header: {
            syncResponseHeaderInfo: {
                statusInfoSet: {
                    statusInfo: StatusInfo[];
                };
            };
        };

        Body: BodyResponse;
    };
};

export abstract class IMSESMassAction<ResponseBodyType, ResultType> {
    protected readonly xmlBuilder: XMLBuilder = new XMLBuilder({ ignoreAttributes: false });

    protected readonly xmlParser: XMLParser = new XMLParser({
        ignoreAttributes: false,
        removeNSPrefix: true,
        isArray: (tagName: string, jPath: string, isLeafNode: boolean, isAttribute: boolean) =>
            tagName === 'statusInfo' || this.isArrayOverride(tagName, jPath, isLeafNode, isAttribute),
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
        const result: BaseMassResponse<ResponseBodyType> = this.xmlParser.parse(
            input,
        ) as BaseMassResponse<ResponseBodyType>;

        const failed: StatusInfo[] = result.Envelope.Header.syncResponseHeaderInfo.statusInfoSet.statusInfo.filter(
            (si: StatusInfo) => si.codeMajor === 'failure',
        );

        if (failed.length > 0) {
            return {
                ok: false,
                error: new ItsLearningError(
                    `${failed.length} of ${result.Envelope.Header.syncResponseHeaderInfo.statusInfoSet.statusInfo.length} Requests failed`,
                    result,
                ),
            };
        } else {
            return this.parseBody(result.Envelope.Body);
        }
    }
}
