import { ITokenInformation } from "../../adobe-id/custom-types/CustomTypes";
import { IDictionary } from "../../facade/IDictionary";
import { StandaloneToken } from "../../token/StandaloneToken";



export interface IAdobeIMS {
    enableLogging(): void;
    disableLogging(): void;
    signUp( requestedParameters: IDictionary, contextToBePassedOnRedirect: any ): void;
    isSignedInUser(): boolean;
    getProfile(): Promise<any>;
    avatarUrl( userId: string ): string;
    getAccessToken(): ITokenInformation | null;
    getReauthAccessToken(): ITokenInformation | null;
    listSocialProviders(): Promise<any>;
    validateToken(): Promise<boolean>;
    setStandAloneToken( standaloneToken: StandaloneToken ): boolean;
    getVerifierByKey( nonce: string ): string;
    initialize(): void;
}