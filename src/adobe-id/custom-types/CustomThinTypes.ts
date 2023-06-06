export type OnReadyFunction = ( applicationState: any ) => void;
export type RideRedirectFunction = ( code: string ) => string;
export type RideRedirectUri = RideRedirectFunction | string | undefined;
