import FragmentHelper from '../../src/url/FragmentHelper';

describe( 'fragmentToObject', () => {

    it( 'should return null if no fragment', () => {
        spyOn( FragmentHelper, 'getHashFromURL' ).and.callFake( function () {
            return '';
        } );
        const fragmentObject = FragmentHelper.fragmentToObject();
        expect( fragmentObject ).toEqual( null );
    } );

    it( 'should return empty object if no values in fragment', () => {
        spyOn( FragmentHelper, 'getHashFromURL' ).and.callFake( function () {
            return '#';
        } );
        const fragmentObject = FragmentHelper.fragmentToObject();
        expect( fragmentObject ).toEqual( {} );
    } );

    it( 'should return object if values in fragment', () => {
        spyOn( FragmentHelper, 'getHashFromURL' ).and.callFake( function () {
            return '#key=val';
        } );
        const fragmentObject = FragmentHelper.fragmentToObject();
        expect( fragmentObject && fragmentObject['key'] ).toEqual( 'val' );
    } );

    it( 'should return object with numeric value', () => {
        spyOn( FragmentHelper, 'getHashFromURL' ).and.callFake( function () {
            return '#key=8';
        } );
        const fragmentObject = FragmentHelper.fragmentToObject();
        expect( fragmentObject && fragmentObject['key'] ).toEqual( '8' );
    } );

    it( 'should return empty value', () => {
        spyOn( FragmentHelper, 'getHashFromURL' ).and.callFake( function () {
            return '#key=';
        } );
        const fragmentObject = FragmentHelper.fragmentToObject();
        expect( fragmentObject && fragmentObject['key'] ).toEqual( '' );
    } );

    it( 'get old hash returns empty string', () => {
        const oldHash = FragmentHelper.getOldHash( '' );
        expect( oldHash ).toEqual( '' );
    } );

    it( 'get old hash returns empty string if no old_hash', () => {
        const oldHash = FragmentHelper.getOldHash( 'input value' );
        expect( oldHash ).toEqual( '' );
    } );
    it( 'get old hash returns empty string if old_hash', () => {
        const oldHash = FragmentHelper.getOldHash( 'input value old_hash=val' );
        expect( oldHash ).toEqual( '' );
    } );

    it( 'get old hash returns hash value if old_hash and client_id', () => {
        const oldHash = FragmentHelper.getOldHash( 'input value old_hash=val&anotherprop=8&from_ims=true&client_id=testclientid' );
        expect( oldHash ).toEqual( 'val&anotherprop=8' );
    } );


    it( 'removeOldHash returns empty string if old_hash', () => {
        const source = 'input value old_hash=val';
        const oldHash = FragmentHelper.removeOldHash( source );
        expect( oldHash ).toEqual( source );
    } );

    it( 'removeOldHash returns hash value if old_hash and client_id', () => {
        const source = 'input value old_hash=val&anotherprop=8&from_ims=true&client_id=testclientid';
        const oldHash = FragmentHelper.getOldHash( source );
        expect( oldHash ).toEqual( 'val&anotherprop=8' );
    } );
} );
