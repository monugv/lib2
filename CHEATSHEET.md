# Quick Start Guide

## Get IMSLib

<details>
<summary>With NPM</summary>

```
npm install @identity/imslib --save
```

Note that you need the following added to your `~/.npmrc`:

```
identity:registry=https://artifactory.corp.adobe.com:443/artifactory/api/npm/npm-adobe-release
//artifactory.corp.adobe.com:443/artifactory/api/npm/npm-adobe-release/:always-auth=false
```

Also, be aware that this works with NPM up to 6; for troubleshooting, check [this wiki](https://wiki.corp.adobe.com/display/ims/%5BLOCAL%5D+SUSI2+Environment+setup+issues)

</details>

<details>
<summary>From CDN</summary>

#### Ims Library:

- (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib.min.js
- (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib.js
- (PROD) https://auth.services.adobe.com/imslib/imslib.min.js

#### Ims Library with polyfills (for all IE versions)

- (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-polyfill.min.js
- (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-polyfill.js
- (PROD) https://auth.services.adobe.com/imslib/imslib-polyfill.min.js

#### Ims thin library (only signIn, signOut, fragment values)

- (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-thin.min.js 
- (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-thin.js
- (PROD) https://auth.services.adobe.com/imslib/imslib-thin.min.js

#### Ims thin library with polyfils (for all IE versions, only signIn, signOut, fragment values)

- (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-thin-polyfill.min.js
- (STAGE) https://auth-stg1.services.adobe.com/imslib/imslib-thin-polyfill.js
- (PROD) https://auth.services.adobe.com/imslib/imslib-thin-polyfill.min.js

</details>

## Initialization

IMSLib reads its configuration from a global object with the following structure:

```javascript
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

<strong>Note</strong>: `environment: 'stg1'` is required only in development mode, the production environment is the default, so it is not necessary to specify it. This option selects the IMS endpoints that are used to perform API calls. 

Be sure to consult the complete structure of this configuration object [here](https://git.corp.adobe.com/pages/IMS/imslib2.js/classes/_adobe_id_adobeiddata_.adobeiddata.html)

<strong>Note</strong>: If IMSLib is loaded from the CDN, then it will automatically call `adobeIms.initialize()` when the script is loaded.

<strong>Note</strong>: During initialization, IMSLib makes a copy of the global config object, for internal use, therefore any change made after initialization to the global object will not be taken into account by IMSLib.

## External parameters

Some IMSLib methods, such as `refreshToken` or `signIn` take an optional argument `externalParameters`. This argument contains overrides for any attribute from the default `adobeid` configuration.

```javascript
window.adobeIMS.signIn({scope: 'customScope'});
```

## Use cases

### Get token and use it to perform API call

Relevant documentation [here](https://git.corp.adobe.com/pages/IMS/imslib2.js/classes/_adobe_ims_adobeims_.adobeims.html#getaccesstoken).

```javascript
window.adobeid = {
    // ...
    onReady: () => {
        const token = window.adobeIMS.getAccessToken().token;
        fetch('https://myapi.adobe.com/', { headers: {
            'Authorization': `Bearer ${token}`
        } }).then(() => console.log('API success'));
    }
}
```

### Get Profile

Relevant documentation [here](https://git.corp.adobe.com/pages/IMS/imslib2.js/classes/_adobe_ims_adobeims_.adobeims.html#getprofile).

```javascript
window.adobeid = {
    // ...
    onReady: () => {
        window.adobeIMS.getProfile().then( profile => {
            console.log(profile);
        });
    }
}
```

### Sign in

Relevant documentation [here](https://git.corp.adobe.com/pages/IMS/imslib2.js/classes/_adobe_ims_adobeims_.adobeims.html#signin).

```javascript
window.adobeIMS.signIn();
```

The sign in process will redirect to the SUSI sign in view. If the redirect provided returns to the same page, then IMSLib will automatically initialize on page load and read the credential provided with the redirect (e.g. `code`). It will then process it and, when the `onReady` callback is triggered, the token and profile should be available to the client application.
