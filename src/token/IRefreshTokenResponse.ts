import { ITokenInformation } from "../adobe-id/custom-types/CustomTypes";

/**
 * represents the api token response after calling the check method
 */
export interface IRefreshTokenResponse {
    tokenInfo: ITokenInformation;

    profile: any;
}