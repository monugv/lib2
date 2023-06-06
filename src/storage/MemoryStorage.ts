import { IDictionary } from './../facade/IDictionary';

/**
 * In-Memory polyFill for localStorage and sessionStorage.
 *
 * @constructor
 * @description Needed for Mac and iOS Safari (v <= 10) in Private Mode. Note that this object doesn't actually
 * persist data across refresh, it just implements the [Storage]{@link external:Storage} interface.
 * @exports memoryStorage
 */
export class MemoryStorage implements Storage {

  /**
   * @type {!Object}
   */
  data: IDictionary = {};

  /**
   * property added in order to be compatible with Storage class
   */
  length = 0;

  /**
   * clear the memory data
   */
  clear (): void {
      this.data = {};
      this.length = 0;
  }

  /**
   * @param key {String} represents the used key to get a value
   * @returns {Object} the value associated with the input key
   */
  getItem ( key: string ): any {
      const value = this.data[ key ];
      return value ? value : null;
  }

  /**
   * 
   * @param key {string} represent the key which will be removed from memory
   * @returns {boolean} true if the key is removed otherwise false
   */
  removeItem ( key: string ): boolean {
      if ( !this.data[ key ] ) {
          return false;
      }

      delete this.data[ key ];
      --this.length;
      return true;
  }

  /**
   * @key {String} - the used key to store a value into memory
   * @value {any} - value associated with the input key  
   */
  setItem ( key: string, value: string ): void {
      if ( !this.data[ key ] ) {
          ++this.length;
      }
      this.data[ key ] = value;
  }

  /**
   * @param index { number } represents the key index
   * method added only to be compatible with Storage class
   * NOT USED 
   */
  [ name: string ]: any;
  key ( index: number ): string | null {
      throw new Error( `Method not implemented. ${ index }` );
  }

}
