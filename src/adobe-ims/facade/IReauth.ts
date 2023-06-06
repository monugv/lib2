
/**
 * Enumeration values used for reAuthenticate method
 * 
 * Default value is check
 */
export enum IReauth {

    /**
     * Forces the reauth process to show the credentials screen to the user
     */
    force = 'force',

    /**
     * Starts the reauthentication check flow. Which won't prompt the user for reauthentication if the user already performed an authentication in a period of time configured on the client id.
     */
    check = 'check'
}