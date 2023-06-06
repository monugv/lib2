import StorageFactory from './../storage/StorageFactory';
import { STORAGE_MODE, PROFILE_STORAGE_KEY } from '../constants/ImsConstants';
import { IServiceRequest } from '../adobe-ims/facade/IServiceRequest';
import { ProfileException } from './ProfileException';
import { HttpErrorResponse } from '../error-handlers/HttpErrorResponse';
import { sortScopes } from '../util/ScopeUtil';

/**
 * class used to implement the profile methods
 */
export class ProfileService {

    /**
    * session storage instance used to manage the profile information
    */
    storage: Storage;

    profileServiceRequest: IServiceRequest
    constructor ( profileServiceRequest: IServiceRequest ) {
        this.profileServiceRequest = profileServiceRequest;
        this.storage = StorageFactory.getStorageByName( STORAGE_MODE.SessionStorage );
    }

    /**
     * 
     * @param token {string} - the string used to obtain the profile information
     */
    getProfile ( token: string ): Promise<any> {
        const { clientId, imsApis } = this.profileServiceRequest;

        const sessionProfile = this.getProfileFromStorage();
        if ( sessionProfile ) {
            return Promise.resolve( sessionProfile );
        }

        return imsApis.getProfile( {
            client_id: clientId,
            token
        } ).then( ( profile ) => {
            // const { data: profile } = response;
            if ( !profile ) {
                throw new ProfileException( 'NO profile response' );
            }
            if ( Object.keys( profile ).length === 0 ) {
                throw new ProfileException( 'NO profile value' );
            }
            this.saveProfileToStorage( profile );
            return Promise.resolve( profile );
        } )
            .catch( ( ex: any ) => {
                if( ex instanceof HttpErrorResponse ) {
                    return Promise.reject( ex );
                }
                this.removeProfile();

                return Promise.reject( ex );
            } )
    }

    /**
    * private method used to compose the key used for storage
    * @param clientId 
    * @param scope 
    * @param isReAuth default false
    */
    private getProfileStorageKey ( ): string {
        const { clientId, scope } = this.profileServiceRequest;
        const isReAuth = false;
        return `${ PROFILE_STORAGE_KEY }/${ clientId }/${ isReAuth }/${ sortScopes( scope )}`;
    }

    /**
     * read the profile from session storage
     */
    getProfileFromStorage (): any {
        const profileStorageKey = this.getProfileStorageKey();
        const sessionProfile = this.storage.getItem( profileStorageKey );
        return sessionProfile && JSON.parse( sessionProfile );
    }

    /**
     * 
     * @param profile {Object} object containing the profile information
     * save the profile to session storage
     */
    saveProfileToStorage ( profile: any ): void {
        const profileStorageKey = this.getProfileStorageKey();
        this.storage.setItem( profileStorageKey, JSON.stringify( profile ) );

    }

    /**
     * remove the profile value from the SessionStorage
     */
    removeProfile (): void {
        const profileStorageKey = this.getProfileStorageKey();
        this.storage.removeItem( profileStorageKey );
    }


    /**
     * 
     * @param userId {string} represents the user id of the new logged user 
     * @returns { boolean } - true if the profile was removed, otherwise false
     */
    removeProfileIfOtherUser ( userId: string ): void {
        if( !userId ) {
            return;
        }
        const profile = this.getProfileFromStorage();
        if( !profile || profile.userId === userId ) {
            return;
        }
        
        this.removeProfile();
    }

}
