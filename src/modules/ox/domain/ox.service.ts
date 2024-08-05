import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { Hash, createHash } from 'crypto';
import { XMLBuilder } from 'fast-xml-parser';
import { lastValueFrom } from 'rxjs';

import { OxConfig } from '../../../shared/config/ox.config.js';
import { OxBaseAction } from '../actions/ox-base-action.js';
import { OxError } from '../../../shared/error/ox.error.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError } from '../../../shared/error/domain.error.js';

@Injectable()
export class OxService {
    private readonly endpoint: string;

    private readonly username: string;

    private readonly password: string;

    private readonly xmlBuilder: XMLBuilder = new XMLBuilder({ ignoreAttributes: false });

    public constructor(
        private readonly httpService: HttpService,
        configService: ConfigService<ServerConfig>,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');

        this.endpoint = oxConfig.ENDPOINT;
        this.username = oxConfig.USERNAME;
        this.password = oxConfig.PASSWORD;
    }

    public async send<ResponseBody, ResultType>(
        action: OxBaseAction<ResponseBody, ResultType>,
    ): Promise<Result<ResultType, DomainError>> {
        const body: object = action.buildRequest();
        const message: string = this.createMessage(body);

        try {
            const response: AxiosResponse<string> = await lastValueFrom(
                this.httpService.post(this.endpoint, message, {
                    headers: {
                        'Content-Type': 'text/xml;charset=UTF-8',
                        SOAPAction: `"${action.action}"`,
                    },
                }),
            );

            return action.parseResponse(response.data);
        } catch (err: unknown) {
            return {
                ok: false,
                error: new OxError('Request failed', [err]),
            };
        }
    }

    private createMessage(body: object): string {
        return this.xmlBuilder.build({
            'soapenv:Envelope': {
                '@_xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',

                'soapenv:Header': this.createSecurityObject(),

                'soapenv:Body': body,
            },
        }) as string;
    }

    private createSecurityObject(): object {
        const now: string = new Date().toISOString();
        const nHash: Hash = createHash('sha1');
        nHash.update(now + Math.random());
        const nonce: string = nHash.digest('base64');

        return {
            'wsse:Security': {
                '@_xmlns:wsse': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
                '@_xmlns:wsu': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
                //'@_soapenv:mustUnderstand': 1,

                'wsse:UsernameToken': {
                    'wsse:Username': this.username,
                    'wsse:Password': {
                        '@_Type':
                            'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText',

                        '#text': this.password,
                    },
                    'wsse:Nonce': {
                        '@_EncodingType':
                            'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary',
                        '#text': nonce,
                    },
                    'wsu:Created': now,
                },
            },
        };
    }
}
