import UrlHelper from '../../src/url/UrlHelper';

describe( 'uriEncodeData', () => {

    it( 'should build the query string from object', () => {
        expect(
            UrlHelper.uriEncodeData(
                {
                    foo: {
                        bar: 'foobar'
                    }
                } )
        ).toEqual( 'foo=%7B%22bar%22%3A%22foobar%22%7D' );
    } );

    it( 'should build the query string from object with no nested properties', () => {
        expect(
            UrlHelper.uriEncodeData(
                {
                    test: 1,
                    name: 'test'
                } )
        ).toEqual( 'test=1&name=test' );
    } );

    it( 'should return empty string if no params', () => {
        expect(
            UrlHelper.uriEncodeData( null )
        ).toEqual( '' );

    } );

    it( 'should encode object to query string', () => {
        const sampleObject = {
            alpha: true,
            bravo: 'string',
            charlie: null,
            delta: undefined,
            echo: {
                foxtrott: true
            }
        };
        expect( UrlHelper.uriEncodeData( sampleObject ) ).toBe( 'alpha=true&bravo=string&charlie=null&echo=%7B%22foxtrott%22%3Atrue%7D' );
    } );

    it( 'should return the value from additionalParams', () => {
        expect(
            UrlHelper.uriEncodeData( {
                client_id: 'client1',
            } )
        ).toEqual( 'client_id=client1' );

    } );

    it( 'setHrefUrl empty', () => {
        const href = window.location.href;
        UrlHelper.setHrefUrl( '' );
        expect( window.location.href ).toEqual( href );
    } );

    it( 'navigate then wait', ( done ) => {
        let test = 'not executed';
        const originalLocation = window.location;
        delete ( window as any ).location;
        window.location = { replace : () => {setTimeout( () => test = 'navigation done', 90 ) } } as any;
        UrlHelper.replaceUrlAndWait( 'http://new.url.adobe.com', 100 ).then( () => { if ( test != 'navigation done' ) test = 'executed' } );
        setTimeout( () => {
            expect( test ).toEqual( 'navigation done' );
            window.location = originalLocation;
            done();
        }, 110 );
    } );

} );
