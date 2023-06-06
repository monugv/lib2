import { AdobeIdData } from './../../src/adobe-id/AdobeIdData';
import { ProfileService } from './../../src/profile/ProfileService';

import { ImsApis } from '../../src/ims-apis/ImsApis';
import { IServiceRequest } from '../../src/adobe-ims/facade/IServiceRequest';
import { IErrorType } from '../../src/adobe-id/IErrorType';
import adobeIdDataValues from './test-data';
import configValues from './config/stage';
import Environment from '../../src/adobe-ims/environment/Environment';
import { IEnvironment } from '../../src/adobe-id/IEnvironment';
import Xhr from '../../src/ims-apis/xhr/Xhr';
import Debouncer from '../../src/debounce/Debouncer';


const createAdobeIdData = ( overrideParams = {}, data = adobeIdDataValues ): AdobeIdData => new AdobeIdData( { ...data, ...overrideParams } );
const adobeIdData: AdobeIdData = createAdobeIdData();

const createProfileService = ( scope?: string ) => {
    
    const imsApis = new ImsApis();
    
    const profileRequest: IServiceRequest = {
        clientId: adobeIdData.client_id,
        scope: scope||adobeIdData.scope,
        imsApis
    };
    
    const profileService = new ProfileService( profileRequest );
    return profileService;
}



const profileUrl = 'https://ims-na1.adobelogin.com/ims/profile/v1?client_id=IMSLibJSTestClient';
const profileService = createProfileService();

Environment.loadEnvironment( IEnvironment.STAGE );

describe( 'Profile Service', () => {
    beforeEach( function () {
        jasmine.clock().install();
        jasmine.clock().mockDate();

        
    } );

    afterEach( function () {
        jasmine.clock().uninstall();
        profileService.storage.clear();
    } );

    it( 'getProfile', ( done ) => {
        jasmine.clock().tick( 1500 );
        const saveProfileToStorageSpy = spyOn( profileService, 'saveProfileToStorage' );
        spyOn( Xhr, 'get' ).and.callFake( function () {
            return Promise.resolve( {
                status: 200,
                data: { name: 'John' }
            } );
        } )

        profileService.getProfile( 'token' ).then( () => {
            expect( saveProfileToStorageSpy ).toHaveBeenCalled();
            done();
        } )
    } )

    describe( 'save profile to storage with sorted scopes', () => {
        const customProfileService: any = createProfileService( 'openid,adobeid' );
        const key = customProfileService.getProfileStorageKey();

        it( 'constructs key with sorted scopes', () => {
            expect( key ).toContain( 'adobeid,openid' );
        } )

        it( 'saves profile to both keys, with scopes sorted', () => {
            customProfileService.saveProfileToStorage( { name:'profilename' } );
            expect( customProfileService.storage.getItem( key ) ).toEqual( '{"name":"profilename"}' );
        } )

        it( 'removes profile from storage', () => {
            customProfileService.saveProfileToStorage( { name:'profilename' } );
            customProfileService.storage.removeItem( key );
            expect( customProfileService.getProfileFromStorage() ).toBeFalsy();
        } )
    } )

    it( 'getProfile returns the value from session storage', ( done ) => {

        const profile = {
            name: 'profilename'
        };
        spyOn( profileService, 'getProfileFromStorage' ).and.callFake( () => {
            return {
                name: 'profilename'
            };
        } );

        profileService.getProfile( 'token' )
            .then( v => {
                expect( v ).toEqual( profile );
                done();
            } );

        done();
    } )

    it( 'getProfile throws error', ( done ) => {

        
        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( function () {
            return null;
        } );
        spyOn( profileService, 'getProfileFromStorage' ).and.callFake( function () {
            return null;
        } );
        const saveProfileToStorageSpy = spyOn( profileService, 'saveProfileToStorage' );
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: null
            } );

        } );

        profileService.getProfile( 'token' )
            .catch( ex => {
                expect( ex.message ).toEqual( 'NO profile response' );
                expect( saveProfileToStorageSpy ).not.toHaveBeenCalled();
                done();
            } )
        

    } )

    it( 'getProfile returns no profile value', ( done ) => {

        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( function () {
            return null;
        } );
        spyOn( profileService, 'getProfileFromStorage' ).and.callFake( function () {
            return null;
        } );

        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: { }
            } );

        } );

        profileService.getProfile( 'token' )
            .catch( ex => {
                expect( ex.errorType ).toEqual( IErrorType.PROFILE_EXCEPTION );
                expect( ex.message ).toEqual( 'NO profile value' );
                done();
            } );

    } );

} );



describe( 'removeProfileIfOtherUser', () => {

    let removeProfileSpy;

    beforeAll( function () {
        removeProfileSpy = spyOn( profileService,  'removeProfile' );
    } );

    beforeEach( function () {
        removeProfileSpy.calls.reset();
    } );

    it( 'no user id', (  ) => {
        profileService.removeProfileIfOtherUser( '' );
        expect( removeProfileSpy ).not.toHaveBeenCalled();
    } )

    it( 'profile is already empty', ( ) => {
        spyOn( profileService, 'getProfileFromStorage' ).and.callFake( function () {
            return null;
        } );
        
        profileService.removeProfileIfOtherUser( 'test' );
        expect( removeProfileSpy ).not.toHaveBeenCalled();
    } )

    it( 'profile is not removed if contains the same key', ( ) => {
        spyOn( profileService, 'getProfileFromStorage' ).and.callFake( function () {
            return {
                userId: 'test'
            };
        } );
        
        profileService.removeProfileIfOtherUser( 'test' );
        expect( removeProfileSpy ).not.toHaveBeenCalled();
    } )


    it( 'profile is removed if is a new key', ( ) => {
        spyOn( profileService, 'getProfileFromStorage' ).and.callFake( function () {
            return {
                userId: 'test'
            };
        } );
        
        profileService.removeProfileIfOtherUser( 'test1' );
        expect( removeProfileSpy ).toHaveBeenCalled();
    } )

} );

