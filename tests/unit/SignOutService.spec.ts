import UrlHelper from '../../src/url/UrlHelper';
import { AdobeIdData } from '../../src/adobe-id/AdobeIdData';
import adobeIdData from './test-data';
import { SignOutService }from '../../src/adobe-ims/sign-out/SignOutService';
import { IRedirectSignoutRequest } from '../../src/adobe-ims/facade/IRedirectSignoutRequest';
import { redirectUriMatching } from '../matchers/adobe.matcher';
import Environment from '../../src/adobe-ims/environment/Environment';

const createAdobeIdData = ( overrideParams = {}, data = adobeIdData ): AdobeIdData => new AdobeIdData( { ...data, ...overrideParams } );

describe( 'execute method', () => {

    it( 'execute the sign out command - no external parameters', () => {
        const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrl' );
        replaceUrlSpy.calls.reset();

        const adobeIdData = createAdobeIdData();

        const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri } = adobeIdData;

        const authorizeRequestData: IRedirectSignoutRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
            },
        };

        const signOutService = new SignOutService();

        signOutService.signOut( authorizeRequestData );

        expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
            client_id: 'IMSLibJSTestClient',
            jslVersion: Environment.jslibver,
            redirectParams:
            {
                from_ims: 'true',
                client_id: 'IMSLibJSTestClient',
                api: 'logout',
                old_hash: 'h1=h1v&h2=h2v#h1=h1v&h2=h2v',
            }
        } ) );
    } );

    it( 'execute the sign out command using external parameters', () => {
        const infoSpy = spyOn( UrlHelper, 'replaceUrl' );
        infoSpy.calls.reset();

        const adobeIdData = createAdobeIdData();

        const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri } = adobeIdData;

        const authorizeRequestData: IRedirectSignoutRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auto: true
            },
        };

        const signOutService = new SignOutService();

        signOutService.signOut( authorizeRequestData );

        expect( infoSpy ).toHaveBeenCalledWith( redirectUriMatching( {
            auto: 'true',
            client_id: 'IMSLibJSTestClient',
            jslVersion: Environment.jslibver,
            redirectParams:
            {
                old_hash: 'h1=h1v&h2=h2v#h1=h1v&h2=h2v',
                from_ims: 'true',
                client_id: 'IMSLibJSTestClient',
                api: 'logout',
            }
        } ) );
        
    } );

} );