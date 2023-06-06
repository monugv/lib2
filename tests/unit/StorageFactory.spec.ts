import StorageFactory from "../../src/storage/StorageFactory";
import { MemoryStorage } from "../../src/storage/MemoryStorage";
import { STORAGE_MODE } from "../../src/constants/ImsConstants";

describe( 'storage factory', () => {

    it( 'returns MemoryStorage storage ', () => {
        const storage = StorageFactory.getStorageByName( STORAGE_MODE.MemoryStorage );
        expect( storage instanceof MemoryStorage ).toBe( true );
    } );

    it( 'returns local storage ', () => {
        const storage = StorageFactory.getAvailableStorage();
        expect( storage instanceof window.Storage ).toBe( true );
    } );

    it( 'returns memory storage if no local or session storage ', () => {

        spyOn( StorageFactory, 'verifyStorage' ).and.callFake( function () {
            return false;
        } );

        const storage = StorageFactory.getAvailableStorage();
        expect( storage instanceof MemoryStorage ).toBe( true );
    } );

    it( 'returns storage by name ', () => {
        const storage = StorageFactory.getStorageByName( STORAGE_MODE.MemoryStorage );
        expect( storage instanceof MemoryStorage ).toBe( true );
    } );

    it( 'returns memory storage if no local or session ', () => {
        spyOn( StorageFactory, 'getStorageInstanceByName' ).and.callFake( () => null );

        const storage = StorageFactory.getStorageByName( STORAGE_MODE.SessionStorage );
        expect( storage instanceof MemoryStorage ).toBe( true );
    } );

} );
