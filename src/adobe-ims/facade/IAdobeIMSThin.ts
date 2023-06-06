import { IDictionary } from "../../facade/IDictionary";

export interface IAdobeIMSThin {
    initialize(): void;
    fragmentValues(): IDictionary | null;
    getNonce(): string | null;
}