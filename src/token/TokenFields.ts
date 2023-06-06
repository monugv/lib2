/* eslint-disable @typescript-eslint/camelcase */
import ApiHelpers from '../api-helpers/ApiHelpers';
import Log from '../log/Log';
import { validateScopeInclusion } from '../util/ScopeUtil';

/**
 * class used to store the token fields obtained during validation and validate the token against values from adobeIdData
 */
export class TokenFields {

       private REAUTH_SCOPE = 'reauthenticated';
       valid?= false;

       isReauth = (): boolean => this.scope.indexOf( this.REAUTH_SCOPE ) >= 0;

       /**
        * represents the client id associated with this token fields
        */
       client_id = '';

       /**
        * represents the scope used to retrieve the token
        */
       scope = '';

       /**
        * represents the token expiration date
        */
       expire = new Date();

       /**
        * represents the user_id associated with the token
        */
       user_id = '';

       tokenValue = '';

       /**
        * represents the session identifier
        */
       sid = '';

       other?: any;

       state: object | null = null;

       /**
        * true if the token fields is created based on the fragment values and not from storage
        */
       fromFragment = false;

       impersonatorId = '';

       isImpersonatedSession = false;

       pbaSatisfiedPolicies?: string[];

       /**
        *
        * @param tokenProps {object} represents the server answer for a validation token request
        * @param expire {Date} represents the token expiration date
        *
        * this class is used to create a TokenFields instance based on storage object;
        * if token was saved by ImsLib v1, the token field is stored in access_token property and expiration in 'expiresAtMilliseconds',
        * otherwise, (for imsLIb v2) 'tokenValue' and 'expire' properties are used
        */
       constructor ( tokenProps: any, expire: Date ) {
           const { valid, tokenValue, access_token, state, other } = tokenProps;
           const token = tokenValue || access_token;

           const parsedToken: any = this.parseJwt( token );
           if ( !parsedToken ) {
               throw new Error( `token cannot be decoded ${token}` );
           }

           this.state = ApiHelpers.toJson( state );

           const { client_id, user_id, scope: tokenScope, sid, imp_id, imp_sid, pba } = parsedToken;

           this.client_id = client_id;
           this.expire = expire;
           this.user_id = user_id;
           this.scope = tokenScope;
           this.valid = valid;
           this.tokenValue = token;
           this.sid = sid;
           this.other = other;
           this.impersonatorId = imp_id || '';
           this.isImpersonatedSession = !!imp_sid;
           this.pbaSatisfiedPolicies = pba && pba.split( ',' ) || [];
       }

       /**
        * parse the token value
        */
       private parseJwt ( token: string ): object | null {
           if( !token ) {
               return null;
           }
           try {
               return JSON.parse( atob( token.split( '.' )[1].replace( /-/g, '+' ).replace( /_/g, '/' ) ) );
           } catch ( ex ) {
               Log.error( 'error on decoding token ', token, ex );
               return null;
           }
       }

       /**
        *
        * @param adobeClientId client id provided on adobe id
        * @param adobeIdScope scope value provided in adobe id
        * @returns {boolean} true if token is valid otherwise false
        */
       validate ( adobeClientId: string, adobeIdScope: string ): boolean {
           const { valid, client_id, scope, expire } = this;

           // check if is expired
           if ( expire < new Date() ) {
               Log.error( 'token invalid  --> expires_at', expire );
               return false;
           }

           if ( valid != undefined && !valid ) {
               Log.error( 'token invalid  --> valid' );
               return false;
           }

           if ( client_id !== adobeClientId ) {
               Log.error( 'token invalid  --> client id', client_id, adobeClientId );
               return false;
           }

           if ( !validateScopeInclusion( adobeIdScope, scope ) ) {
               Log.error( 'token invalid  --> scope', ' token scope =', scope, 'vs adobeIdScope =', adobeIdScope, '.' );
               return false;
           }

           return true;
       }
}
