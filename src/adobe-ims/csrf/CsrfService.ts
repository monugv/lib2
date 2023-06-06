import StorageFactory from "../../storage/StorageFactory";
import { MemoryStorage } from "../../storage/MemoryStorage";
import { IDictionary } from "../../facade/IDictionary";
import { INonce } from './INonce';

/**
 * nonce key used for store the Csrf nonce value
 */
const NONCE = 'nonce';
const NONCE_LENGTH = 16;
export const ONE_HOUR = 60 * 60 * 3600;

/**
 * class used for the CSRF process
 */
export class CsrfService {

  /**
   * represents the Storage instance used during Csrf flow
   */
  private storageInstance: Storage | null = null;

  /**
   * represents the storage key used to save the nonce values for current client Id
   */
  private nonceStorageKey = '';

  /**
   * 
   * @param clientId {String} the client id used for Csrf
   */
  constructor ( clientId: string ) {
      this.nonceStorageKey = `${NONCE}${clientId}`;
  }

  get storage (): Storage {
      if ( !this.storageInstance ) {
          this.storageInstance = StorageFactory.getAvailableStorage();
      }
      return this.storageInstance;
  }

  /**
   * Starts the CSRF process by trying to save a random string value to available storage
   * @returns the nonce value
   */
  initialize (): string {

      if ( !this.isStorageAvailable() ) {
          return '';
      }

      const nonce: INonce = CsrfService.generateNonce();

      let nonceStorageValue = this.getNonceFromStorage() || {};

      nonceStorageValue = this.clearOlderNonceKeys( nonceStorageValue );

      this.addNonceToObject( nonceStorageValue, nonce );

      this.saveNonceValuesToStorage( nonceStorageValue );

      return nonce.value;
  }

  /**
   * 
   * @param nonceStorageValue represents the object used to store the nonce values
   * @param nonce represents the nonce value
   */
  addNonceToObject ( nonceStorageValue: IDictionary, nonce: INonce ): void {
      nonceStorageValue[nonce.value] = nonce.expiry;
  }

  /**
   * clears the local storage keys older than 1h
   * @param nonceStorageValue local storage object used to store nonce
   */
  clearOlderNonceKeys ( nonceStorageValue: IDictionary, olderThan = ONE_HOUR ): IDictionary {
      const oneHourAgo = Date.now() - olderThan;
      let expiry = 0;
      Object.keys( nonceStorageValue ).forEach( key => {
          expiry = parseInt( nonceStorageValue[key] as string );

          if ( expiry < oneHourAgo ) {
              delete nonceStorageValue[key];
          }
      } );

      return nonceStorageValue;
  }

  /**
   * @param fragmentNonce represents the nonce value received after redirect from ims
   * @returns {boolean} true if nonce is valid, otherwise false
   */
  verify ( fragmentNonce: string ): boolean {

      if ( !this.isStorageAvailable() ) {
          return true;
      }

      const storageNonce = this.getNonceFromStorage();

      if ( !storageNonce ) {
          return false;
      }

      const nonceStorageValue = this.clearOlderNonceKeys( storageNonce );

      const isValidCsrf = ( nonceStorageValue[fragmentNonce] || null ) !== null;

      if ( isValidCsrf ) {
          this.clearNonceValueFromStorage( nonceStorageValue, fragmentNonce );
      }

      return isValidCsrf;
  }

  /**
   * 
   * @param nonceStorageValue represents the saved nonce values into the Storage
   * @param fragmentNonce is nonce value which will be removed from Storage
   */
  clearNonceValueFromStorage ( nonceStorageValue: IDictionary, fragmentNonce: string ): void {
      delete nonceStorageValue[fragmentNonce];

      this.saveNonceValuesToStorage( nonceStorageValue );
  }

  /**
   * Returns the nonce values from storage as an Object or null
   * @returns {IDictionary | null}
   */
  getNonceFromStorage (): IDictionary | null {

      const nonce = this.storage.getItem( this.nonceStorageKey );

      return nonce ? JSON.parse( nonce ) : null;
  }

  /**
 * @param nonceValues the nonce values which will be saved to Storage
 */
  private saveNonceValuesToStorage ( nonceValues: IDictionary ): void {
      this.storage.setItem( this.nonceStorageKey, JSON.stringify( nonceValues ) );
  }

  /**
   * function used to check if the local or session storage is available
   */
  isStorageAvailable (): boolean {
      return !( this.storage instanceof MemoryStorage )
  }

  /**
   * @function randomString
   * used to generate a random string during the initialization of Csrf process
   */
  static randomString = (): string => {
      const cryptorandomString = CsrfService.cryptoRndomString();
      if( cryptorandomString ) {
          return cryptorandomString;
      } 

      let text = "";
      const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for ( let i = 0; i < NONCE_LENGTH; i++ ) {
          text += possible.charAt( Math.floor( Math.random() * possible.length ) );
      }
      return text;
  }

  /**
   * generate random string based on crypto object
   */
  static cryptoRndomString (): string {
      if ( !window.crypto ) {
          return '';
      }
      const array = new Uint32Array( 3 );
      window.crypto.getRandomValues( array );

      return array.join( '' ).substr( 0, NONCE_LENGTH );
  }

  /**
   * generate a key value pair used for nonce
   * @returns INonce object
   */
  static generateNonce = (): INonce => ( {
      value: CsrfService.randomString(),
      expiry: new Date().getTime().toString()
  } )

}
