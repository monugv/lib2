export interface ISocialHeadlessSignInRequest {
    provider_id: 'google'|'apple'|'facebook';
    idp_token: string;
    client_id: string;
    scope: string;
    state: any;
    accepted_tou_list: string[];
    country?: string;
    dob_year?: number;
    dob_month?: number;
    dob_dat?: number;
    locale?: string;
}

export interface ISocialHeadlessSignInResponse {
    token: string;
    token_type: string;
    expires_in: number;
}