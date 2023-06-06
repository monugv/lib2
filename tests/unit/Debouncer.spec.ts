import Debouncer from '../../src/debounce/Debouncer';
import { ApiResponse } from '../../src/ims-apis/xhr/ApiResponse';


describe( ' Debounce unit tests', () => {

    beforeEach( function () {
        jasmine.createSpy( "timerCallback" );
        jasmine.clock().install();
    } );

    afterEach( function () {
        jasmine.clock().uninstall();
    } );


    const url = 'urlValue';

    it( 'storeApiSuccess', ( done ) => {
        Debouncer.storeApiResponse( url, 'test', new ApiResponse( 200, {
            a: 1,
        } ) );

        const cachedValue = Debouncer.getCachedApiResponse( url, 'test' );

        expect( cachedValue ).toEqual( {
            data: { a: 1 },
            status: 200
        } );

        jasmine.clock().tick( 1500 );

        const timeElapsedValue = Debouncer.getCachedApiResponse( url, 'test' );
        expect( timeElapsedValue ).toBe( null );
        done();

    } )


} );
