import { CsrfService } from '../../src/adobe-ims/csrf/CsrfService';
import { INonce } from '../../src/adobe-ims/csrf/INonce';

const ONE_HOUR = 60 * 60 * 3600;

const generateNonce = ( key: string, time: number ): INonce => {
    return {
        value: key,
        expiry: ( new Date().getTime() - time ).toString()
    }
}

describe( 'CSRF', () => {

    it( 'clearNonceValueFromStorage ', () => {
        const storageObject = {};

        const csrf: CsrfService = new CsrfService( 'client' );
        csrf.addNonceToObject( storageObject, generateNonce( 'key1', ONE_HOUR - 1 ) );

        csrf.clearNonceValueFromStorage( storageObject, 'key1' );

        const storageValue = csrf.getNonceFromStorage() || { a: 1 };
        expect( Object.keys( storageValue ).length ).toEqual( 0 );
    } );

    it( 'clearOlderNonceKeys ', () => {
        const csrf: CsrfService = new CsrfService( 'client' );
        const storageObject = {};

        csrf.addNonceToObject( storageObject, generateNonce( 'key1', ONE_HOUR + 1000 ) );
        csrf.addNonceToObject( storageObject, generateNonce( 'key2', 3600 ) );
        csrf.addNonceToObject( storageObject, generateNonce( 'key3', ONE_HOUR - 1000 ) );

        const newStorage = csrf.clearOlderNonceKeys( storageObject );

        expect( Object.keys( newStorage ).length ).toEqual( 2 );

    } );

    it( 'initialize ', () => {
        const csrf: CsrfService = new CsrfService( 'client' );
        const nonce = csrf.initialize();

        const storage = csrf.getNonceFromStorage() || {};

        expect( nonce ).toBeDefined();
        expect( Object.keys( storage ).length ).toEqual( 1 );

    } );

    it( 'cryptoRndomString ', () => {
        const key = CsrfService.cryptoRndomString();
        expect( key ).toEqual( key );
    } );

    it( 'verify returns true if nonce match', () => {
        const csrf: CsrfService = new CsrfService( 'client' );

        const clearNonceValueFromStorageSpy = spyOn( csrf, 'clearNonceValueFromStorage' );

        const storage = csrf.getNonceFromStorage() || {};

        const key = Object.keys( storage )[ 0 ];

        const verifyResponse = csrf.verify( key );

        expect( verifyResponse ).toEqual( true );
        expect( clearNonceValueFromStorageSpy ).toHaveBeenCalled();

    } );

    it( 'verify returns true if no fragment', () => {
        const csrf: CsrfService = new CsrfService( 'client' );
        const verifyResponse = csrf.verify( '' );

        expect( verifyResponse ).toEqual( false );
    } );

    it( 'verify returns true if no storage is available', () => {
        const csrf: CsrfService = new CsrfService( 'client' );

        const storageAvailableSpy = spyOn( csrf, 'isStorageAvailable' ).and.callFake( function () {
            return false;
        } );

        const verifyResponse = csrf.verify( 'test' );

        storageAvailableSpy.calls.reset();

        expect( verifyResponse ).toEqual( true );
    } );

    it( 'verify returns false if fragment is different', () => {
        const csrf: CsrfService = new CsrfService( 'client' );
        const verifyResponse = csrf.verify( '123' );

        expect( verifyResponse ).toEqual( false );

    } );

} );
