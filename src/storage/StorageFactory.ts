import { MemoryStorage } from './MemoryStorage';
import { STORAGE_MODE } from '../constants/ImsConstants';
import Log from '../log/Log';

/**
 * A cross-browser way to use `sessionStorage`
 *
 * @exports storage
 * @requires MemoryStorage
 */
class StorageFactory {

  memoryStorageInstance: MemoryStorage | null = null;
  get memoryStorage (): MemoryStorage {
      if( !this.memoryStorageInstance ) {
          this.memoryStorageInstance = new MemoryStorage();
      }
      return this.memoryStorageInstance;
  }
  
  /**
  * 
  * @param storageName represents the storage name
  * @returns the local or session storage; in case there is a problem with storage, the memory storage is returned
  */
  getStorageByName ( storageName: STORAGE_MODE ): Storage {
    
      const storageInstance = this.getStorageInstanceByName( storageName );

      if ( !storageInstance ) {
          return this.memoryStorage;
      }

      return this.verifyStorage( storageInstance ) ? storageInstance : this.memoryStorage;
  }

  /**
   * method used to get the avilable storage and to give the possibility to mock the behaviour
   * @param storageName the storage name used to get the storage
   * @returns Storage or null
   */
  getStorageInstanceByName ( storageName: STORAGE_MODE ): Storage | null {
      if( storageName === STORAGE_MODE.MemoryStorage ) {
          return this.memoryStorage;
      }
      try{
          return storageName === STORAGE_MODE.LocalStorage ? window.localStorage : window.sessionStorage;
      }
      catch( ex ) {
          Log.warn( 'Please change your cookies settings in order to allow local data to be set' );
          return null;
      }
  }

  /**
   * returns the available storage; the priority is local storage and after that the session storage
   * if no local or session storage is available, the Memory Storage is returned
   */
  getAvailableStorage (): Storage {
      const storage = this.getStorageByName( STORAGE_MODE.LocalStorage );
      if( storage instanceof MemoryStorage ) {
          return this.getStorageByName( STORAGE_MODE.SessionStorage );
      }
      return storage;
  }

  /**
   * 
   * @param storage represents the storage instance
   * @returns true if storage is working as expected otherwise false
   */
  verifyStorage ( storage: Storage ): boolean {
      const storageKey = 'test';

      try {
          storage.setItem( storageKey, 'true' );
          const storageValue = storage.getItem( storageKey );

          if ( storageValue !== 'true' ) {
              return false;
          }
          storage.removeItem( storageKey );

          return true;
      }
      catch ( ex ) {
          return false;
      }
  }

}

export default new StorageFactory();