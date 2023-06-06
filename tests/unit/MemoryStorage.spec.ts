import { MemoryStorage } from './../../src/storage/MemoryStorage';

const memoryStorageInst = new MemoryStorage();

describe( 'memoryStorageInst module', () => {
    beforeEach( () => {
        memoryStorageInst.clear();
    } );

    it( 'should save keys', () => {
        memoryStorageInst.setItem( 'key', 'value' );
        expect( memoryStorageInst.getItem( 'key' ) ).toBe( 'value' );
    } );

    it( 'should serialize all values with String', () => {

        memoryStorageInst.setItem( 'bool', 'true' );
        memoryStorageInst.setItem( 'number', '1' );
        memoryStorageInst.setItem( 'string', 'foo' );

        expect( memoryStorageInst.getItem( 'bool' ) ).toBe( String( true ) );
        expect( memoryStorageInst.getItem( 'number' ) ).toBe( String( 1 ) );
        expect( memoryStorageInst.getItem( 'string' ) ).toBe( String( 'foo' ) );

    } );

    it( 'should return null for unknown keys', () => {
        expect( memoryStorageInst.getItem( 'non-existing-key' ) ).toBeNull();
    } );

    it( 'should overwrite saved keys', () => {

        memoryStorageInst.setItem( 'key', 'first value' );
        memoryStorageInst.setItem( 'key', 'second' );

        expect( memoryStorageInst.getItem( 'key' ) ).toBe( 'second' );
    } );

    it( 'should delete saved keys', () => {

        memoryStorageInst.setItem( 'key', 'true' );
        memoryStorageInst.removeItem( 'key' );

        expect( memoryStorageInst.getItem( 'key' ) ).toBeNull();
    } );

    it( 'should ignore delete requests for unknown keys', () => {

        const storage = memoryStorageInst;
        expect( () => {
            storage.removeItem( 'non-existing-key' );
        } ).not.toThrow();
        expect( memoryStorageInst.getItem( 'non-existing-key' ) ).toBeNull();
    } );

    it( 'should clear all items', () => {

        memoryStorageInst.setItem( 'first', 'foo' );
        memoryStorageInst.setItem( 'second', '1' );

        memoryStorageInst.clear();

        expect( memoryStorageInst.getItem( 'first' ) ).toBeNull();
        expect( memoryStorageInst.getItem( 'second' ) ).toBeNull();
    } );

    it( 'should count the stored items', () => {

        memoryStorageInst.clear();
        expect( memoryStorageInst.length ).toBe( 0 );

        memoryStorageInst.setItem( 'first', '1' );
        expect( memoryStorageInst.length ).toBe( 1 );

        memoryStorageInst.setItem( 'second', '2' );
        expect( memoryStorageInst.length ).toBe( 2 );

        memoryStorageInst.removeItem( 'first' );
        expect( memoryStorageInst.length ).toBe( 1 );

        memoryStorageInst.setItem( 'first', '1' );
        expect( memoryStorageInst.length ).toBe( 2 );

        memoryStorageInst.clear();
        expect( memoryStorageInst.length ).toBe( 0 );
    } );

} );
