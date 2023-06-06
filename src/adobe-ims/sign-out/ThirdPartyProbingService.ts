import UrlHelper from "../../url/UrlHelper";
import Xhr from "../../ims-apis/xhr/Xhr";

export class ThirdPartyProbingService {
    probe = ( urls: string[], clientId: string, timeout = 2000 ): Promise<number[]> => {
        if ( !urls || urls.length === 0 ) {
            return Promise.resolve( [] )
        }

        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': 0,
            'X-IMS-CLIENTID': clientId
        }
        const probePath = '/cdsc_probe?' + UrlHelper.uriEncodeData( { client_id: clientId } )
        const results: number[] = []
        const promises: Promise<any>[] = []
        for ( let i = 0; i < urls.length; i++ ) {
            const url = urls[i] + probePath
            promises.push(
                Xhr.post( url, {}, headers, false, timeout )
                    .then( response => response.ok && results.push( i ) )
                    .catch( () => {
                        // avoid unhandled promise warnings
                    } )
            )
        }

        return Promise.all( promises )
            .then( () => results )
    }
}
