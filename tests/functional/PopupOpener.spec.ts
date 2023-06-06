import PopupOpener from '../../src/adobe-ims/sign-in/PopupOpener';
import { PopupSettings } from '../../src/adobe-ims/sign-in/PopupSettings';

const VALID_URL = 'https://adobe.com';
const VALID_ORIGIN = 'https://auth-stg1.services.adobe.com';

describe( 'popup opener', () => {

    beforeEach( function () {
        jasmine.createSpy( "timerCallback" );
        jasmine.clock().install();
    } );

    afterEach( function () {
        jasmine.clock().uninstall();
    } );
    
    it( 'should call the onPopupMessage', () => {
        let popupMessage;
        const onPopupMessage = ( info ) => {
            popupMessage = info;
        };

        const modalSettings = new PopupSettings( {} );
        PopupOpener.openSignInWindow( 'testurl', 'nonce', modalSettings, onPopupMessage );
        
        PopupOpener.receiveMessage( {
            origin: VALID_ORIGIN,
            data: VALID_URL,
        } );

        expect( popupMessage ).toEqual( VALID_URL );
    } );

    it( 'should reject messages from unknown origins', () => {
        let popupMessage = "unchanged";
        const onPopupMessage = ( info ) => {
            popupMessage = info;
        };

        const modalSettings = new PopupSettings( {} );
        PopupOpener.openSignInWindow( 'testurl', 'nonce', modalSettings, onPopupMessage );
        
        PopupOpener.receiveMessage( {
            origin: 'http://unknown.origin',
            data: 'test',
        } );

        expect( popupMessage ).toEqual( "unchanged" );
    } );

    for( const testData of [ 'javascript:alert("alert")', 'http://malicious.com', 'not-a-url' ] ) {
        it( `should reject messages containing non-https URL ${testData}`, () => {
            let popupMessage = "unchanged";
            const onPopupMessage = ( info ) => {
                popupMessage = info;
            };

            const modalSettings = new PopupSettings( {} );
            PopupOpener.openSignInWindow( 'testurl', 'nonce', modalSettings, onPopupMessage );
        
            PopupOpener.receiveMessage( {
                origin: 'http://unknown.origin',
                data: testData,
            } );

            expect( popupMessage ).toEqual( "unchanged" );
        } );
    }

    it( 'should call the onPopupMessage only one time', () => {
        let popupMessage = 0;
        const onPopupMessage = ( info ) => {
            popupMessage++;
        };

        /**
         * using allowOrigin '' because of this bug in jsdom: https://github.com/jsdom/jsdom/issues/2745
         */

        const modalSettings = new PopupSettings( { allowedOrigin: '' } );
        
        PopupOpener.openSignInWindow( VALID_ORIGIN, 'nonce', modalSettings, onPopupMessage );
        PopupOpener.openSignInWindow( VALID_ORIGIN, 'nonce', modalSettings, onPopupMessage );
        PopupOpener.openSignInWindow( VALID_ORIGIN, 'nonce', modalSettings, onPopupMessage );
        
        window.postMessage( VALID_URL, '*' );

        jasmine.clock().tick( 10 );
        expect( popupMessage ).toEqual( 1 );
        
    } );
    
} );
