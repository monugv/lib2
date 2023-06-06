import StorageFactory from '../../src/storage/StorageFactory';
import { STORAGE_MODE } from '../../src/constants/ImsConstants';

const storage: Storage = StorageFactory.getStorageByName( STORAGE_MODE.LocalStorage );

describe( 'LocalStorage module', () => {

    it( 'should save keys', () => {
        if ( storage == null ) {
            return;
        }
        storage.setItem( 'key', 'value' );
        expect( storage.getItem( 'key' ) ).toBe( 'value' );
    } );

    it( 'should serialize all values with String()', () => {
        if ( storage == null ) {
            return;
        }
        storage.setItem( 'bool', 'true' );
        storage.setItem( 'number', '1' );
        storage.setItem( 'string', 'foo' );

        expect( storage.getItem( 'bool' ) ).toBe( String( true ) );
        expect( storage.getItem( 'number' ) ).toBe( String( 1 ) );
        expect( storage.getItem( 'string' ) ).toBe( String( 'foo' ) );
    } );

    it( 'should return null for unknown keys', () => {
        if ( storage == null ) {
            return;
        }
        expect( storage.getItem( 'non-existing-key' ) ).toBeNull();
    } );

    it( 'should overwrite saved keys', () => {
        if ( storage == null ) {
            return;
        }
        storage.setItem( 'key', 'first value' );
        storage.setItem( 'key', 'second' );

        expect( storage.getItem( 'key' ) ).toBe( 'second' );
    } );

    it( 'should delete saved keys', () => {
        if ( storage == null ) {
            return;
        }
        storage.setItem( 'key', 'true' );
        storage.removeItem( 'key' );

        expect( storage.getItem( 'key' ) ).toBeNull();
    } );

    it( 'should ignore delete requests for unknown keys', () => {
        if ( storage == null ) {
            return;
        }
        expect( () => {
            if ( storage == null ) {
                return;
            }
            storage.removeItem( 'non-existing-key' )
        } ).not.toThrow();
        expect( storage.getItem( 'non-existing-key' ) ).toBeNull();
    } );

} );
