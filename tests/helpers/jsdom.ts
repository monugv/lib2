
import { JSDOM } from 'jsdom';
import set from 'lodash/set';
import atob from 'atob';
import btoa from 'btoa';
import { Crypto } from "@peculiar/webcrypto"


const DEFAULT_HTML = '<html><body></body></html>';
export const TARGET_PORT = 9235;
export const TARGET_HOST = `localhost:${TARGET_PORT}`;
export const TARGET_ORIGIN = `http://${TARGET_HOST}`;

const userAgent = 'chrome';

const dom = new JSDOM( DEFAULT_HTML, {
    url: TARGET_ORIGIN,
    referrer: TARGET_ORIGIN,
    contentType: 'text/html',
    userAgent,
    includeNodeLocations: true,
} );

const { window } = dom;

set( global, 'document', window.document );
set( global, 'window', window );
set( global, 'navigator', {
    userAgent,
} );

let channelId = 0;

const channels = {}

set( global, 'BroadcastChannel', ( name: string ) => {
    const id = ++channelId;
    const newInstance = {
        id,
        close: (): void => channels[name] = channels[name].filter( ch => ch.id != id ),
        postMessage: ( msg: string ): void => channels[name]
            .forEach( ch => ch.onmessage && ch.onmessage( { origin: 'https://auth.services.adobe.com', data: msg }  ) )
    };
    channels[name] = [...channels[name]||[], newInstance];
    return newInstance;
} )


set( global, 'atob', atob );
set( global, 'btoa', btoa );
const crypto = new Crypto();
set( window, 'crypto', new Crypto() );

set( window, 'adobeid', {
    client_id: 'IMSLibJSTestClient',
    locale: 'ro',
    scope: 'AdobeID,openid',
    standalone: {},
    environment: 'stg1',
    analytics: {
        appCode: 'appcode',
        appVersion: 'appversion',
    }
} );
