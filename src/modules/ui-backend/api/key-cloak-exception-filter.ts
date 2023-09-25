import {Catch} from '@nestjs/common';
import {KeycloakClientError} from "../../../shared/error/index.js";
import {UiBackendExceptionFilter} from "./ui-backend-exception-filter.js";

@Catch(KeycloakClientError)
export class KeyCloakExceptionFilter extends UiBackendExceptionFilter<KeycloakClientError>{
}
