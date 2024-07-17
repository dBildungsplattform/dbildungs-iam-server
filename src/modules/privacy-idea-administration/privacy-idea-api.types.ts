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
