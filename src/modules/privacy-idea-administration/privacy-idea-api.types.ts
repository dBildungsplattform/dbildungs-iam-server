export type InitSoftwareTokenResponse = {
    details: {
        googleurl: {
            description: string;
            img: string;
            value: string;
        };
        oathurl: {
            description: string;
            img: string;
            value: string;
        };
        otpkey: {
            description: string;
            img: string;
            value: string;
            value_b32: string;
        };
        rollout_state: string;
        serial: string;
        threadid: number;
    };
};

export type InitSoftwareTokenPayload = {
    genkey: number;
    keysize: number;
    description: string;
    user: string;
    type: string;
    otplen: number;
    hashlib: string;
    '2stepinit': number;
    otpkeyformat: string;
    rollover: number;
};

export type TokenStatePayload = {
    type: string;
    user: string;
};

export type PrivacyIdeaTokenInfo = {
    hashlib: string;
    timeShift: string;
    timeStep: string;
    timeWindow: string;
    tokenkind: string;
};
export type PrivacyIdeaToken = {
    active: boolean;
    count: number;
    count_window: number;
    description: string;
    failcount: number;
    id: number;
    info: PrivacyIdeaTokenInfo;
    locked: boolean;
    maxfail: number;
    otplen: number;
    realms: string[];
    resolver: string;
    revoked: boolean;
    rollout_state: string;
    serial: string;
    sync_window: number;
    tokengroup: string[];
    tokentype: string;
    user_editable: boolean;
    user_id: string;
    user_realm: string;
    username: string;
};

export type PrivacyIdeaResponseTokens = {
    id: number;
    jsonrpc: string;
    result: {
        status: boolean;
        value: {
            count: number;
            current: number;
            next: string | null;
            prev: string | null;
            tokens: PrivacyIdeaToken[];
        };
    };
    time: number;
    version: string;
    versionnumber: string;
    signature: string;
};

export type AuthenticaitonResponse = {
    id: number;
    jsonrpc: string;
    result: {
        status: boolean;
        value: {
            log_level: number;
            menus: string[];
            realm: string;
            rights: string[];
            role: string;
            token: string;
            username: string;
            logout_time: number;
            audit_page_size: number;
            token_page_size: number;
            user_page_size: number;
            policy_template_url: string;
            default_tokentype: string;
            user_details: boolean;
            token_wizard: boolean;
            token_wizard_2nd: boolean;
            admin_dashboard: boolean;
            dialog_no_token: boolean;
            search_on_enter: boolean;
            timeout_action: string;
            token_rollover: Record<string, unknown>;
            hide_welcome: boolean;
            hide_buttons: boolean;
            deletion_confirmation: boolean;
            show_seed: boolean;
            show_node: string;
            subscription_status: number;
            subscription_status_push: number;
            qr_image_android: string | null;
            qr_image_ios: string | null;
            qr_image_custom: string | null;
            logout_redirect_url: string;
            require_description: string[];
        };
    };
    time: number;
    version: string;
    versionnumber: string;
    signature: string;
};
