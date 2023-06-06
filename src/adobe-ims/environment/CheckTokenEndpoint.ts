export class CheckTokenEndpoint {

    // The /check/v*/token API is proxied on some third party domains and
    // imslib should use those endpoints when running on those domains.

    private static THIRD_PARTY_DOMAINS_PROD = {
        'behance.net': 'https://sso.behance.net'
    }

    private static THIRD_PARTY_DOMAINS_STAGE = {
        's2stagehance.com': 'https://sso.s2stagehance.com'
    }

    public static computeEndpoint (
        useProxy: boolean, hostname: string, isStage: boolean, servicesUrl: string
    ): CheckTokenEndpoint {
        if ( useProxy ) {
            const domainMap = isStage ? CheckTokenEndpoint.THIRD_PARTY_DOMAINS_STAGE
                : CheckTokenEndpoint.THIRD_PARTY_DOMAINS_PROD;
            for ( const domain of Object.keys( domainMap ) ) {
                if ( hostname === domain || hostname.endsWith( '.' + domain ) ) {
                    return new CheckTokenEndpoint( true, domainMap[domain], servicesUrl );
                }
            }
        }

        return new CheckTokenEndpoint( false, servicesUrl );
    }

    proxied: boolean;
    url: string;
    fallbackUrl: string;

    constructor ( proxied = false, url = '', fallbackUrl = '' ) {
        this.proxied = proxied;
        this.url = url;
        this.fallbackUrl = fallbackUrl;
    }

    public shouldFallbackToAdobe( e ): boolean {
        if(!this.proxied) {
            return false;
        }
        return e.error === 'feature_disabled' && e.error_description === 'cdsc';
    }

}
