import { ITokenAutoRefreshParams } from "./ITokenAutoRefreshParams";
import Log from "../../log/Log";

/**
 * auto refresh minutes interval
 */
const ONE_MIN_MS = 60000;
const ONE_SECOND_MS = 1000;
const REFRESH_INTERVAL_BEFORE_EXPIRATION_MIN = 1;
const USER_INTERACTION_EVENTS = ['keyup', 'mousemove'];


/**
 * class used for automatically refresh the token.
 * the refreshToken method is automatically triggered one minute before the token expires
 * if the user interacted with the page at all after the startAutoRefreshFlow was called.
 */
class TokenAutoRefresh {

    /**
     * represents the timer used to refresh the token before the last N minutes;
     */
    refreshTimerId;


    /**
     * Token Autorefresh parameters updated by the {@link startAutoRefreshFlow} method
     */
    refreshParameters?: ITokenAutoRefreshParams;

    /**
     * Holds the date of the last user interaction
     */
    lastUserInteraction = Date.now();

    /**
     * Flag that the user was active at all during this refresh cycle
     */

    userActive = false;

    /**
     * Handler for user interactions
     * Initiates the Token Refresh one minute before it expires, if any interaction is detected
     * Returns immediately if the refresh is already scheduled
     * @returns
     */
    userInteractionHandler = (): void => {
        this.lastUserInteraction = Date.now();
        this.userActive = true;
    }

    /**
     * starts the autorefresh flow
     * @param autoRefreshParameters {@link ITokenAutoRefreshParams} parameters used for auto refresh flow
     */
    startAutoRefreshFlow ( autoRefreshParameters: ITokenAutoRefreshParams ): void {
        if ( !autoRefreshParameters || !autoRefreshParameters.expire
            || !autoRefreshParameters.refreshTokenMethod ) {
            Log.info( 'Won\'t schedule token auto-refresh',
                !autoRefreshParameters, !autoRefreshParameters.expire,
                !autoRefreshParameters.refreshTokenMethod )
            return;
        }

        this.refreshParameters = autoRefreshParameters;

        if( this.refreshTimerId ) {
            Log.info( 'Auto-refresh timer already set, clearing' )
            clearTimeout( this.refreshTimerId );
        }

        this.clearDomEvents();

        this.initializeDomEvents();

        const interval = this.fromNowToNMinutesBeforeDate( this.refreshParameters?.expire, REFRESH_INTERVAL_BEFORE_EXPIRATION_MIN );
        Log.info( 'Auto-refresh timer will run after (seconds)', interval / ONE_SECOND_MS )
        this.refreshTimerId = setTimeout( () =>  {
            if( this.userActive ) {
                const userInactiveSince = Math.floor( ( Date.now() - this.lastUserInteraction ) / ONE_SECOND_MS );
                this.refreshParameters?.refreshTokenMethod( { userInactiveSince }, true );
                Log.info( 'Auto-refresh performed, user was inactive for (seconds)', userInactiveSince )
            } else {
                Log.info( 'Auto-refresh skipped, user was never active' )
            }
        }, interval );
    }

    /**
    * Initializes the event listeners for user interaction
    * The function passed must be the member bound to this instance
    */
    private initializeDomEvents = (): void => {
        USER_INTERACTION_EVENTS.forEach( eventName => window.addEventListener( eventName, this.userInteractionHandler ) );

    }

    /**
     * Clears event listeners
     */
    private clearDomEvents =  (): void => {
        USER_INTERACTION_EVENTS.forEach( eventName => window.removeEventListener( eventName, this.userInteractionHandler ) );
    }


    /**
     * Returns the milliseconds interval from now to a given date minus N minutes
     * @param toDate represents the target date
     * @param nMinutes represents the number of minutes to substract from the target date
     * @returns the interval in milliseconds; if the resulting interval is <= 0,
     * this method returns nMinutes in ms
     */
    private fromNowToNMinutesBeforeDate ( toDate: Date, nMinutes: number ): number {
        const interval  = toDate.getTime() - Date.now() - nMinutes * ONE_MIN_MS;
        if( interval <= 0 ) {
            return nMinutes * ONE_MIN_MS;
        }
        return interval;
    }

}

export default new TokenAutoRefresh();
