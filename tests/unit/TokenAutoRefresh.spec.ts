import TokenAutoRefresh from '../../src/adobe-ims/token-auto-refresh/TokenAutoRefresh';
import { ITokenAutoRefreshParams } from '../../src/adobe-ims/token-auto-refresh/ITokenAutoRefreshParams';
import DomEvents from '../helpers/DomEvents';
const ONE_MIN = 60000;


const timeElapsed = ( ms ): void => {
    jasmine.clock().tick( ms );
}

describe( 'Token auto refresh', () => {

    beforeEach( function () {
        jasmine.clock().install();

        jasmine.clock().mockDate( new Date() );
    } );

    afterEach( function () {
        jasmine.clock().uninstall();
    } );

    it( 'refresh method is not called if no user interaction', () => {
        let refreshCalled = false;
        const refresh = (): void => {
            refreshCalled = true;
        }
        const refreshParameters: ITokenAutoRefreshParams = {
            expire: new Date( Date.now() + 20 * ONE_MIN ),
            refreshTokenMethod: refresh,
        }
        TokenAutoRefresh.startAutoRefreshFlow( refreshParameters );

        timeElapsed( 21 * ONE_MIN );

        expect( refreshCalled ).toBeFalse();
    } );

    it( 'refresh method is called during the last minute before the token expiration, with the time since the last interaction', () => {

        let refreshCalled = false;

        let userInactiveSince = 0;

        const refresh = ( params ): void => {
            refreshCalled = true;
            userInactiveSince = params.userInactiveSince ;
        }

        const refreshParameters: ITokenAutoRefreshParams = {
            expire: new Date( Date.now() + 20 * ONE_MIN ),
            refreshTokenMethod: refresh,
        }

        TokenAutoRefresh.startAutoRefreshFlow( refreshParameters );

        timeElapsed( 4 * ONE_MIN );

        DomEvents.simulateMouseMove( window.document );

        expect( refreshCalled ).toBeFalse();

        timeElapsed( 2 * ONE_MIN );

        DomEvents.simulateMouseMove( window.document );

        timeElapsed( 12.9 * ONE_MIN );

        expect( refreshCalled ).toBeFalse();

        timeElapsed( 0.1 * ONE_MIN );

        expect( refreshCalled ).toBeTrue();
        expect ( userInactiveSince ).toEqual( 780 );

    } );

} );
