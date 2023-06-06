import { TokenFields } from "../token/TokenFields";
import { IDictionary } from "../facade/IDictionary";


export class TokenProfileResponse {
    tokenFields: TokenFields;

    profile: IDictionary| null = null;

    constructor ( tokenFields: TokenFields, profile: IDictionary | null ) {
        this.tokenFields = tokenFields;
        this.profile = profile;
    }
}