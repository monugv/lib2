

import { ICodeChallenge } from '../../adobe-id/ICodeChallenge';
import { IDictionary } from '../../facade/IDictionary';
import StorageFactory from '../../storage/StorageFactory';
export const ONE_HOUR = 60 * 60 * 3600;
export class CodeChallenge {
    storage: Storage;
    constructor () {
        this.storage = StorageFactory.getAvailableStorage();
    }
    
    b64Uri ( r ): string {
        return btoa( r ).replace( /\+/g, "-" ).replace( /\//g, "_" ).replace( /=+$/, "" )
    }

    /**
     * 
     * @param nonce {String} represents the key used to store the code verifier
     * @param verifierLength {number} represents the verifier length
     * @returns {ICodeChallenge} verifier and challenge codes
     */
    createCodeChallenge ( nonce: string, verifierLength = 43 ): Promise<ICodeChallenge> {
        
        const cryptoObj = window['msCrypto'] || window.crypto;
        const verifier = this.b64Uri( Array.prototype.map.call( cryptoObj.getRandomValues( new Uint8Array( verifierLength ) ), function ( r ) {
            return String.fromCharCode( r )
        } ).join( "" ) ).substring( 0, verifierLength );

        const uintVerifierArr = new Uint8Array( verifier.length );
        for ( let i = 0; i < verifier.length; i++ ) uintVerifierArr[i] = verifier.charCodeAt( i );

        const cryptoDigest: any | Promise<any> = cryptoObj.subtle.digest( 'SHA-256', uintVerifierArr );

        return new Promise( ( resolve, reject ) => {
            if( window['CryptoOperation'] ) {
                cryptoDigest.onerror = ( err ): void => reject( err );
    
                cryptoDigest.oncomplete =  ( response ): void  => {
                    const uintArr = new Uint8Array( response.target.result );

                    const challenge = this.b64Uri( String.fromCharCode( ...uintArr ) );

                    return resolve( this.saveVerifierAndReturn( nonce, {
                        verifier,
                        challenge,
                    } ) );
                } 
    
            } else {
                cryptoDigest.then(  ( response ) => {
                    const uintArr = new Uint8Array( response );
                    const challenge = this.b64Uri( String.fromCharCode( ...uintArr ) ); 
                    return resolve( this.saveVerifierAndReturn( nonce, {
                        verifier,
                        challenge,
                    } ) );
                } )
            }
        } );
        
    }

    /**
     * 
     * @param nonce {String} represents the key used to store the code verifier
     * @param challengeAndVerifier {ICodeChallenge} represents the code challenge and code verifier
     * @returns ICodeChallenge
     */
    saveVerifierAndReturn ( nonce: string, challengeAndVerifier: ICodeChallenge ): Promise<ICodeChallenge> {
        const verifiers = this.getVerifierValuesFromStorage();
        const storageValue = {
            verifier: challengeAndVerifier.verifier || '',
            expiry: new Date().getTime().toString()
        }
        verifiers[nonce] = storageValue;

        this.storage.setItem( 'verifiers', JSON.stringify( verifiers ) );
        
        return Promise.resolve( challengeAndVerifier );
    }

    /**
   * Returns the nonce values from storage as an Object or null
   * @returns {IDictionary | null}
   */
    getVerifierValuesFromStorage (): IDictionary {

        const storageVerifiers = this.storage.getItem( 'verifiers' );

        const verifiers = storageVerifiers? JSON.parse( storageVerifiers ) : {}; 

        return this.clearOlderVerifiers( verifiers );
    }

    clearOlderVerifiers ( verifiers: IDictionary, olderThan = ONE_HOUR ): IDictionary {
        const oneHourAgo = Date.now() - olderThan;
        let expiry = 0;
        Object.keys( verifiers ).forEach( key => {
            expiry = parseInt( verifiers[key] as string );
  
            if ( expiry < oneHourAgo ) {
                delete verifiers[key];
            }
        } );
  
        return verifiers;
    }

   
    /**
     * rerturns the verifier from storage
     * @param key {String} represents the key used to stora the verfier
     */
    getVerifierByKey ( key: string ): string {
        const verifiers = this.getVerifierValuesFromStorage();
        const verifierObj = verifiers ? verifiers[key] : {};
        delete verifiers[key];

        this.storage.setItem( 'verifiers', JSON.stringify( verifiers ) );

        return verifierObj? verifierObj['verifier'] : '';

    }
    
}