import PopupOpener from '../../src/adobe-ims/sign-in/PopupOpener';
import { PopupSettings } from '../../src/adobe-ims/sign-in/PopupSettings';

describe( 'popup opener', () => {

    beforeEach( function () {
        jasmine.createSpy( "timerCallback" );
        jasmine.clock().install();
    } );

    afterEach( function () {
        jasmine.clock().uninstall();
    } );

    it( 'should call the window.open function', () => {
        let popupMessage;
        const onPopupMessage = ( info ) => {
            popupMessage = info;
        };

        const windowOpenSpy = spyOn( window, 'open' ).and.callThrough();

        const modalSettings = new PopupSettings( {} );
        PopupOpener.openSignInWindow( 'testurl', 'nonce', modalSettings, onPopupMessage );
        
        expect( windowOpenSpy ).toHaveBeenCalled();
        
    } );
    
    it( 'no opener', () => {
        let popupMessage;
        const onPopupMessage = ( info ) => {
            popupMessage = info;
        };

        const modalSettings = new PopupSettings( { } );
        PopupOpener.openSignInWindow( 'testurl', 'nonce', modalSettings, onPopupMessage );
        
        new BroadcastChannel( "imslib" ).postMessage( 'https://redirecturl.net' );

        expect( popupMessage ).toEqual( 'https://redirecturl.net' );
        
    } );
} );
