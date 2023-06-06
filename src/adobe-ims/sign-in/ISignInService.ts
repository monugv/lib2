
import { IRedirectRequest } from "../facade/IRedirectRequest";

export interface ISignInService {
    signIn( redirectRequest: IRedirectRequest ): void;
}