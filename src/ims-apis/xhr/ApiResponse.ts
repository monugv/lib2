
/**
 * class used to store the xhr error response
 */
export class ApiResponse {

    status = 0;
    data: any = '';
    constructor ( 
        status: number,
        message: any,
    ) {
        this.status = status;
        this.data = this.toJson( message );
    }

    private toJson ( value: string ): string| object {
        try{
            if( typeof value !== 'string' ) {
                return value;
            }
            return JSON.parse( value );
        }
        catch {
            return value;
        }
    }
}