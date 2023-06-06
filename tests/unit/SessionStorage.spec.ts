import StorageFactory from '../../src/storage/StorageFactory';
import { STORAGE_MODE } from '../../src/constants/ImsConstants';

const storage: Storage = StorageFactory.getStorageByName( STORAGE_MODE.SessionStorage );

describe( 'SessionStorage module', () => {

    it( 'should save keys', () => {
        if ( !storage ) {
            return;
        }
        storage.setItem( 'key', 'value' );
        expect( storage.getItem( 'key' ) ).toBe( 'value' );
    } );

    it( 'should serialize all values with String()', () => {
        if ( !storage ) {
            return;
        }
        storage.setItem( 'bool', 'true' );

        expect( storage.getItem( 'bool' ) ).toBe( String( true ) );
    } );

    it( 'should return null for unknown keys', () => {
        if ( !storage ) {
            return;
        }
        expect( storage.getItem( 'non-existing-key' ) ).toBeNull();
    } );

    it( 'should overwrite saved keys', () => {
        if ( !storage ) {
            return;
        }
        storage.setItem( 'key', 'first value' );
        storage.setItem( 'key', 'second' );

        expect( storage.getItem( 'key' ) ).toBe( 'second' );
    } );

    it( 'should delete saved keys', () => {
        if ( !storage ) {
            return;
        }
        storage.setItem( 'key', 'true' );
        storage.removeItem( 'key' );

        expect( storage.getItem( 'key' ) ).toBeNull();
    } );

    it( 'should ignore delete requests for unknown keys', () => {
        if ( !storage ) {
            return;
        }
        expect( () => {
            if ( !storage ) {
                return;
            }
            storage.removeItem( 'non-existing-key' )
        } ).not.toThrow();
        expect( storage.getItem( 'non-existing-key' ) ).toBeNull();
    } );
} );
