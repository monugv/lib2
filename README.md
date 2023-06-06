# Table of contents
1. [About this project](#about)
2. [What's new in imslib2.js ?](#new)
3. [Documentation](#documentation)
4. [Artefacts](#artefacts)
5. [Specific features](#features)
6. [Integration guide](#guide)
    1. [Initialize the library](#initialize)
    2. [Determine imslib.js version](#version)
    3. [Code example](#example)
    4. [Demo application](#demo)
    5. [Differences between v1 and v2: Methods](#v1v2-methods)
    6. [Differences between v1 and v2: Events](#v1v2-events)
    7. [3rd party library integration](#adobe-launch)
    8. [Standalone mode (initialize the library with an existing token)"](#standalone)
    9. [IJT mode (initialize the library with an existing ijt token)"](#ijttoken) 
7. [Contributor resources](#contributor)

# About this project <a name="about"></a>
imslib2.js is a new implementation of imslib.js, a JavaScript library for integration with IMS. Imslib.js aims to close this gap and provide a layer of interaction with the Identity Services that is uniform and consistent across all web integrations.
Main features:
- Single sign on
- Session persistence
- Authorization
- Resource accesss
- Seamless client integration
# What's new in imslib2.js ? <a name="new"></a>
- Different versions of the library are available
  - Regular
  - Thin version (only support for signin and logout)
  - Polyfill version 
- Library is available online as well as artifactory (to be used via npm)
- CSRF protection
- Debouncing

# Documentation <a name="documentation"></a>
- [AdobeIMS class](https://git.corp.adobe.com/pages/IMS/imslib2.js/classes/_adobe_ims_adobeims_.adobeims.html)
- IMS integration guide, https://wiki.corp.adobe.com/display/ims/IMS+Integration+Guide
- IMS APIs https://wiki.corp.adobe.com/display/ims/Endpoints+Index
- Old imslib.js, https://git.corp.adobe.com/pages/IMS/imslib.js

# Artefacts <a name="artefacts"></a>
## Hosted
- Ims Library: 
  * (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib.min.js
  * (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib.js
  * (PROD) https://auth.services.adobe.com/imslib/imslib.min.js

- Ims Library (for all IE versions)
  * (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-polyfill.min.js
  * (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-polyfill.js
  * (PROD) https://auth.services.adobe.com/imslib/imslib-polyfill.min.js

- Ims thin library (only signIn, signOut, fragment values)
  * (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-thin.min.js / 
  * (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-thin.js
  * (PROD) https://auth.services.adobe.com/imslib/imslib-thin.min.js 

- Ims thin library with polyfils (only signIn, signOut, fragment values)
  * (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-thin-polyfill.min.js
  * (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-thin-polyfill.js
  * (PROD)https://auth.services.adobe.com/imslib/imslib-thin-polyfill.min.js



## Artifactory
Add the following to your ~/.npmrc:
```
@identity:registry=https://artifactory.corp.adobe.com:443/artifactory/api/npm/npm-adobe-release
//artifactory.corp.adobe.com:443/artifactory/api/npm/npm-adobe-release/:always-auth=false
```

Ims library can be added to a project by installing the package
```
npm install @identity/imslib --save
```

After instalation the library can be imported as described below:
```
import { AdobeIMS, AdobeIMSThin, AdobeIMSPolyfill, AdobeIMSThinPolyfill } from '@identity/imslib';
const adobeIms = new AdobeIMS();
adobeIms.initialize();
```
*NOTE:* Depending by application requirements, is better to import only one library instead of all of them.


# Specific features <a name="features"></a>
##  CSRF
IMSLib has a built-in protection against CSRF, where a nonce is generated and encoded into the redirect uri. More information here, https://wiki.corp.adobe.com/display/ims/CSRF+documentation+and+flow
For the thin version of the libarary, developers must pass the nonce value to signIn method as a second argument and verify the nonce value on redirect. For this, there are two helper methods: `getNonce()` and `fragmentValues()`
Is recommended the nonce length to be 16 alphanumeric characters. 

The CSRF documentation flow can be found here: https://wiki.corp.adobe.com/display/ims/CSRF+documentation+and+flow

## Debouncing
All API responses are cached for 1 second interval

## Storage
The default storage used by ims library is **session storage** 

if adobeid.useLocalStorage value is true, local storage it is used, otherwise session storage.

**Note:** in order to use local storage for storing the access tokens you will need ASSET approval

## Logging
The default behaviour is not to write the log messages to the console;

window.adobeId can contain the logsEnabled property; if true, the log messages will be visible to the console window otherwise not;

On runtime, the developer has the possibility to enable the logging mechanism by calling:
```
adobeIMS.enableLogging();    
```
 or disable by calling

```
adobeIMS.disableLogging();    
```


## Custom Http Errors
The library handles three types of http errors: networkError(0), rate_limited (429), server_error(5xx). For each one of these errors, the session or any local storage value remain unchanged.
The onError handler is triggered in case of (0, 429, 5xx): `adobeId.onError(IErrorType.Http, message)`
Message can contain the following fields:
```
    code: number;
    error?: string;
    retryAfter?: number;
    message?: string;
```

## Rate limiting
IMSLib.js offers the following notification in case of rate limiting response from IMS :
    
```
{
    name: 'rate_limit',
    retryAfter: httpException.header ? parseInt( httpException.headers.retryAfter ) : 10,
}
```

This information is used to call the onError handler registered on adobeid;


# Integration of imslib v2 <a name="guide"></a>
### Initialize the library <a name="initialize"></a>
```
window.adobeid = {
      client_id: 'IMSLibJSTestClient',
      scope: 'AdobeID,openid',
      locale: 'en_US',
      environment: 'stg1',
      useLocalStorage: false,
      autoValidateToken: true,
      onAccessToken: function (tokenInformation) {
      },
      onReauthAccessToken: function (reauthTokenInformation) {
      },
      onError: function (error) {
      },
      onAccessTokenHasExpired: function() {
      },
      onReady: function(appState) {
      }
  };
```

`onAccessToken` and `onReauthAccessToken` events are triggered using the following object structure

```
    token: string; //the token
    expire: Date; // expiration date
    sid: string; // session identifier
    token_type?: string; // token type
```

Notes:
- When the page is loading, the `adobeims.initialize()` is automatically called and the token events are triggered; the final event is `onReady`

### Determine imslib.js version <a name="version"></a>
In order to differentiate between imslib v1 and v2, imslib2.js contains a version property `version() : string` used to determine the imslib version. 
You can test for imslib2.js as follows
```
  if(adobeIMS.version.startsWith('v2-')) {
      // imslib version 2 is used
  }
```

### Code example <a name="example"></a>
  ```
  adobeIMSMethods = {
      signIn: function () {
          adobeIMS.signIn({
              test: 1,
          }, { say: 'hello' });
      },
      authorizeToken(token): function() {}
      getAccessToken: function () {
          vm.state.token = adobeIMS.getAccessToken();
      },
      refreshToken: function () {
          adobeIMS.refreshToken();
      },
      reAuthenticate: function () {
          adobeIMS.reAuthenticate({
          }, "check");
      },
      reAuthenticateForce: function () {
          adobeIMS.reAuthenticate({
              api: 'apioverride',
          }, "force");
      },
      getReauthAccessToken: function () {
          vm.state.rtoken = adobeIMS.getReauthAccessToken();
      },
      signOut: function () {
          adobeIMS.signOut({});
      },
      getProfile: function () {
          adobeIMS.getProfile().then(profile => {
                  vm.state.profile = profile;
          })
          .catch( ex => {
                  vm.state.profile = ex;
          })
      },
      signUp: function () {
          adobeIMS.signUp();
      },
      validateToken: function() {
          adobeIMS.validateToken().then(v => {
          })
          .catch(ex => {
          })
      },
      signInWithSocialProvider: function() {
          adobeIMS.signInWithSocialProvider('google');
      }, 
      jumpToken: function() {
        //https://wiki.corp.adobe.com/display/ims/Implicit+Jump+Tokens
        adobeIMS.jumpToken({
          bearer_token: 'The user access token for the application',
          target_client_id: 'target_client',
        }).then((response: IJumpTokenResponse) => {
          Url.location.replace(response.jump)
        })
      },
  };
  ```

### Demo application <a name=demo></a>

The react demo application has examples for:
 - Loading the library via CDN link
 - Loading the library via npm
 - The thin library (which only contains sign in and sign out methods)

Links:
 - Code: https://git.corp.adobe.com/IMS/imslib2.js/tree/master/demo-apps/react
 - Hosted: https://git.corp.adobe.com/pages/IMS/imslib2.js/demo-react-app/index.html

Running locally:
 - Get the code from git
 - Edit the hosts file to contain

    ```
      127.0.0.1	localhost.corp.adobe.com
      localhost:3000 localhost.corp.adobe.com:9000
    ```

 - Navigate the source directory and run:
    - npm install
    - npm start

 - Verify if your local route is white listed (imss.corp.adobe.com). The used values for demo app are: 
    https://localhost\.corp\.adobe\.com
    https://localhost\.corp\.adobe\.com:9000/\S*

 - In case there is a websocket error (when the application starts), please follow below steps: 
    - edit node_modules/react-dev-utils/webpackHotDevClient.js
    - on line 62, put: protocol: window.location.protocol === 'https:' ? 'wss' : 'ws',

### Differences between v1 and v2: Methods <a name="v1v2-methods"></a>
Below table contains the existing methods from the two ims libraries.

  | IMSLIB V1 | IMSLIB V2 | Comments |
| ------ | ------ | ------ |
| `acquireAccessToken(successFn, errorFn)` | `refreshToken(externalParameters)` | |
| `addEventListener(eventType, callback)` | | see subscribeToimsInstance() |
| `decodeAccessToken(tokenString)`  |  | Deprecated. Info is provided on `onAccessToken` |
| `getAccessToken(isReAuthenticationopt, client_idopt, scopeopt)` | `getAccessToken() && getReauthAccessToken()`  |
| `getAccessTokenInfo(isReAuthenticationopt, client_idopt, scopeopt)` |  | Deprecated. Info is provided on `onAccessToken` |
| `getAccessTokenSessionStorageKey(isReAuthenticationopt, client_idopt, scopeopt)` |  | Deprecated |
| `getAdobeIdApiParametersForApi(apinon-null)` |  | Available in `adobeid` |
| `getClientID(apiopt, extraParamsopt)` |  | Available in `adobeid` |
| `getContextFromRedirectForAccessToken(access_tokennon-null)` | triggered by `onReady(context);`  |
| `getKeyForAccessToken(access_tokennon-null)` |  | Deprecated |
| `getLocale()` |  | Available in `adobeid` |
| `getReleaseFlags(doneFn, errorFnnullable)` |  | Available in adobeIMS |
| `getScope(apiopt, extraParamsopt)` |  | Available in `adobeid` |
| `getState()` |  | Available in `adobeid` |
| `getTransitoryAuthorizationCode(params, successCallback, errorCallbacknullable)` |  | Available in adobeIMS |
| `getUserPictureURL()` | `avatarUrl(userId: string): string` | |
| `getUserProfile()` | `getProfile(): Promise` |
| `hasTokenButItHasExpired(isReAuthenticationopt, client_idopt, scopeopt)` | | Token is automatically refreshed |
| `isKnownClientID(client_idnon-null)` |  | Deprecated, see section for multiple client support |
| `isMandatorySignIn()` |  | Deprecated |
| `isModal()` |  | Deprecated |
| `isReady()` |  | Deprecated, for integration with 3rd party libs please take look [here](#adobe-launch) |
| `isReAuthentication(api_parametersopt)` |  | Deprecated |
| `isRefreshSSOCookiesEnabled()` |  | Deprecated |
| `isReleaseFlagActive(flag)` | `getReleaseFlags(): Promise` |  |
| `isSignedInUser(isReAuthenticationopt, client_idopt, scopeopt)` | `isSignedInUser(): boolean` |
| `isSingleLogOutEnabled()` |  | SLO is enabled on all clients |
| `listSocialProviders(successCallback, errorCallbackopt)` | `listSocialProviders(): []` |
| `loadFromStorage()` |  | Deprecated |
| `makeApiCall(apinon-null, versionopt, paramsnullable, fnToCall)` |  | Deprecated |
| `matchesTheRequiredScope(scopeToValidatenon-null)` | | Deprecated |
| `reAuthenticate(api_parametersopt, contexttobepassedonredirectopt)` | `reAuthenticate(requestedParameters?: IDictionary, reauth?: IReauth, contextToBePassedOnRedirect?: any): void` |
| `setProfile(profile)` | | Deprecated |
| `setStandaloneToken(newToken)` | `setStandaloneToken(newToken)` | |
| `shouldAcceptTheToken(access_tokennon-null, client_idnon-null, scopenon-null, user_idnon-null, isValidnon-null, isReAuthenticationnon-null)` |  | Deprecated |
| `signIn(api_parametersopt, contexttobepassedonredirectopt)` | `signIn(externalParameters?: IDictionary, contextToBePassedOnRedirect?: any): void` | |
| `signInBasedOnSingleSignOnSSO(fnContinuation)` |  | Deprecated |
| `signInWithSocialProvider(providerName, parametersopt)` | `signInWithSocialProvider(providerName: any, externalParameters?: IDictionary, contextToBePassedOnRedirect?: any): void` | |
| `signOut(api_parametersopt)` | `signOut(externalParameters?: IDictionary)` | |
| `signUp(api_parametersopt, contexttobepassedonredirectopt)` | `signUp(requestedParameters?: IDictionary, contextToBePassedOnRedirect?: any)` | |
| `sunbreakHack(scopenon-null) → (non-null) {Scope}` |  | Deprecated (obviously) |
| `switchToModalMode()` |  | Switching is no longer supported |
| `switchToRedirectMode()` |  | Switching is no longer supported |
| `testAccessTokenIsStillValid(access_token, fnToCallAtTheEnd)` | `validateToken: Promise<boolean>` | |
| `testSingleLogOutSLO(fnContinuation)` | | Deprecated |
| `toggleLogging(mode)` |  `enableLogging()`, `disableLogging()` | |
| `updateRedirectUriForReAuthentication(redirect_urinullable, api_parametersnullable)` |  | Deprecated |
| `validateSSOCookieLifetime(access_token, fnContinuation)` |  | Deprecated |
| `signInWithSocialProvider(providerName: any, externalParameters?: IDictionary, contextToBePassedOnRedirect?: any): void` |  `refreshToken(externalParameters?: IDictionary): Promise` | |
| | `jumpToken(jumpTokenRequest, externalParameters)` |  |  |

### Differences between v1 and v2: Events <a name="v1v2-events"></a>
Below table contains the existing events/properties from the two ims libraries.

| IMSLIB V1 | IMSLIB V2 | Comments |
| ------ | ------ | ------ | 
| `onProfile` | `onProfile` | |
| `onAccessToken` | `onAccessToken` | |
|  | `onReauthAccessToken` | |
| `onAccessTokenHasExpired` | `onAccessTokenHasExpired` | |
| `onError` | `onError` | |
| `onProfile` | `onProfile` | |
| `api_parameters` | `api_parameters` | |
| `client_id` | `client_id` | |
| `debug` | `logsEnabled` | |
| `is_mandatory_sign_in` | | Deprecated |
| `locale` | `locale` | | |
| `redirect_uri` | `redirect_uri` | |
| `openidCompatible` | | TBD |
| `scope` | `scope` | |
| `uses_modal_mode` | `modalMode` |  |
| `uses_redirect_mode` | |  |
| `standalone` | `standalone` | contains the default token at the moment of initialization. |
| `ijt` | | `ijt` | contains the ijt value used for initialization
| `preferred_storage` | `useLocalStorage` | Default is session storage |
| | `autoValidateToken` | optional property |
| | `environment` | Default is prod. possible values are stg1 and prod |
| | `analytics: {appCode: string, appVersion: string}` | Is added automatically to state object |

#### AutoValidateToken
In the previous IMSLib.js version we automatically checked whether the cached access token is still valid by doing a /validate_token call. This behavior is no longer enabled by default. In order to enable this behavior you will need to set the `adobeid.autoValidateToken` property to true.

#### Analytics
In order to send the `ac` and `av` values in the state parameter used by Adobe Analytics you should no longer override the state parameter, but rather use the [`adobeid.analytics` object](https://git.corp.adobe.com/pages/IMS/imslib2.js/classes/_adobe_id_analyticsparameters_.analyticsparameters.html).

#### State
imslib.js append a context parameter to the redirect as parameter. In contrast, imslib2.js packs the context into the state parameters (which then becomes part of the IMS token). 

### 3rd party library integration <a name="adobe-launch"></a>
There are use cases where other libraries such as adobe-launch need the AdobeIMS instance from IMSLib in order to know whether or not a user is signed in and retrieve user profile data. In order to make the AdobeIMS instance available to the other library we will cover the following scenarios.

  1. Analytics library is created BEFORE any AdobeIMSLib instance

      The logic is that the analytics library will subscribe to the 'onImsLibInstance' dom event name;

      ```
        subscribeToimsInstance = (): void => {
            window.addEventListener( 'onImsLibInstance',  this.onImsInstance, false );
        }
        onImsInstance  = ( evt: any ): void => {
            this.imsInstances.push( evt.detail );
        }
      ```

  2. Analytics library is created AFTER any AdobeIMSLib instance
      In this case, the analytics library should "ask" for any existent imsLib instances;

      ```
        askForImsInstance = (): void => {
          const evt = document.createEvent( 'CustomEvent' );
          evt.initCustomEvent( 'getImsLibInstance, false, false, null );
          window.dispatchEvent( evt );
        }
      ```

      Any existent imsLib instance is triggered by using the first approach (using onImsLibInstance event name)

      *Note*: 
       - In order to prevent multiple ims lib instances, the analytics library must check against imsInstance.adobeId.client_id
       - dom events will contain only AdobeIMS instances which already fired the onReady event.

### Standalone mode (initialize the library with an existing token) <a name="standalone"></a>
The library has the ability to use a default token at the moment of initialization
This can help developers to test the applications by using a specific token.

standalone token structure is: 
```
adobeid: {
  ...
  standalone: {
    token: 'your token',
    expirems: token expiration in ms
  }
}

```

### IJT mode (initialize the library with an existing ijt token) <a name="ijttoken"></a>
The ijt flow is used to create a new access token based on a ijt token; The developers must implement the following steps: 
   - The aplication have o read the ijt from the url
   - Set the ijt value into adobeid: ``` adobeIMS.adobeIdData.ijt = 'ijtValue' ```
   - Trigger the adobeIMS.initialize() method
   
### Modal Mode
Modal mode is used for opening SUSI (the Sign Up Sign In page) in a new modal window.

In order to open SUSI in a new window you will need to set the `adobeid.modalMode` to true. This will open SUSI in a new modal window in order to login the user.
After receving the access token in te modal window, it will send it to the parent window and automatically close the modal.

We also provide a way to configure the modal window by setting the `adobeid.modalSettings` property using the [PopupSettings class](https://git.corp.adobe.com/pages/IMS/imslib2.js/classes/_adobe_ims_sign_in_popupsettings_.popupsettings.html).

Notes:
- IMSLib2 does not support switching from modal mode to redirect mode.


# Developer resources <a name=“contributor”></a>
## Install dependencies
The first step is the instalation of required packages. For this,  the following comand should be used: 
```
npm ci
```

## Code lint
```
npm run eslint
```

## Compiling all sources
```
npm run build
```

Building the library for different environments: 
```
npm run build:stg1
npm run build:prod
```

Additional parameters can be passed in order to controll the output bundle
```
npm run build -- --config- env=stg1+polyfill=true+thin=true
```

*Note*: Default values for above parameters are:
```
  env = 'stg1'
  polyfill = false
  thin=false
```

## Unit Testing
```
npm run unittest
```

For debugging, update the args attribute for '.vscode\launch.json' to ```"args": ["--config=./jasmine_unit.json", "${file}"],``` 

## Functional testing
Test plan, https://wiki.corp.adobe.com/display/ims/IMS+v2+-+Test+plan
```
npm run functionaltest
```
For debugging, update the args attribute for '.vscode\launch.json' to ```"args": ["--config=./jasmine_unit.json", "${file}"],``` 

## Integration testing
  The automated tests are located under /tests/automation directory

  Install necessary dependencies: ```npm ci```  (from the automation directory)

  Start the server by executing: ```http-server -S -p 9000```

  Run the integration tests: ```npm test```

  NOTE: Integration tests can be started by using: 
  ```npm run start-automatedtest``` (from main imslib directory)

  Testing only against stg1
  ```npm run start-automatedtest:stage```

  Testing only against prod
  ```npm run start-automatedtest:prod```

## Coverage
To generate the coverage report for unit tests (output directory is coverage):
  ```
  npm run coverage
  ```
  
To generate the coverage report for unit tests for functional tests (output directory is coverage-functional)
  ```
  npm run coverage-functional
  ```
  
## Dependencies
Installing a new package as a dev dependency
```
npm install <new_dependency> --save-dev
```

Installing a new package as a dependency
```
npm install <new_dependency> --save
```
