import { ImsApis } from '../../src/ims-apis/ImsApis';

import Xhr from '../../src/ims-apis/xhr/Xhr';

const imsApi = new ImsApis( );

describe( 'Debounce', () => {

    beforeEach( function () {
        jasmine.createSpy( "timerCallback" );
        jasmine.clock().install();
    } );

    afterEach( function () {
        jasmine.clock().uninstall();
    } );


    it( 'verify debounce when api replies with success', ( done ) => {
        const validateResponse = { value: 10 };
        spyOn( Xhr, 'post' ).and.callFake( function () {
            return Promise.resolve( {
                status: 200,
                data: validateResponse
            } );
        } );


        imsApi.validateToken( {
            token: 'token',
            client_id: 'testclientNGSuSi'
        } ).then( response => {

            expect( response ).toEqual( validateResponse );
            Xhr.post = function (): Promise<any> {
                return Promise.resolve( {
                    status: 200,
                    data: { test: true }
                } );
            }
            imsApi.validateToken( {
                token: 'token',
                client_id: 'testclientNGSuSi'
            } ).then( v => {
                expect( v ).toEqual( { test: true } );
            } );

            jasmine.clock().tick( 1500 );

            imsApi.validateToken( {
                token: 'token',
                client_id: 'testclientNGSuSi'
            } ).then( v => {
                expect( v ).toEqual( {
                    test: true
                } );
                done();
            } )

        } );


    } )

    it( 'verify debounce when POST api replies with failure', ( done ) => {
        const postSpy = spyOn( Xhr, 'post' ).and.callFake( function () {
            return Promise.reject( {
                status: 404,
                data: null,
            } );
        } );

        imsApi.logoutToken( {
            token: 'token',
            client_id: 'testclientNGSuSi'
        } ).catch( ( ex ) => {
            
            expect( ex ).toBeNull();

            postSpy.calls.reset();
            postSpy.and.callFake( function () {
                return Promise.resolve( {
                    status: 200,
                    data: {
                        test: true,
                    },
                } );
            } );

            imsApi.logoutToken( {
                token: 'token',
                client_id: 'testclientNGSuSi'
            } ).catch( ex => {
                expect( ex ).toEqual( null );
            } );

            jasmine.clock().tick( 1500 );

            imsApi.logoutToken( {
                token: 'token',
                client_id: 'testclientNGSuSi'
            } ).then( v => {
                expect( v ).toEqual( {
                    test: true
                } );
                done();
            } )

        } );
    } )

    it( 'verify debounce when GET api replies with failure', ( done ) => {
        const getSpy = spyOn( Xhr, 'get' ).and.callFake( function () {
            return Promise.reject( {
                status: 404,
                data: null,
            } );
        } );


        imsApi.checkStatus().catch( () => {

            getSpy.calls.reset();
            getSpy.and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: {
                        test: true,
                    }
                } );
            } );
            imsApi.checkStatus().catch( ex => {
                expect( ex ).toEqual( null );
            } );

            jasmine.clock().tick( 1500 );

            imsApi.checkStatus().then( v => {
                expect( v ).toEqual( {
                    test: true
                } );
                done();
            } )

        } )
    } )


} );
