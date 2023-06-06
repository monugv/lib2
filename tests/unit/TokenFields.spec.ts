import { TokenFields } from './../../src/token/TokenFields';
import TokenHelper from './../helpers/token-helper';

const startDateTokenFields = new Date();
const tokenFieldsData = TokenHelper.tokenFieldsData( startDateTokenFields );
const ONE_HOUR_MS = 60 * 60 * 1000; 

describe( 'TokenFields', () => {

    it( 'it create a new instance of TokenFields', () => {
        const tokenFields: TokenFields = new TokenFields( tokenFieldsData, new Date( new Date().getTime() + ONE_HOUR_MS ) );

        expect( tokenFields.tokenValue ).toBe( tokenFieldsData.tokenValue );
        expect( tokenFields.valid ).toBe( tokenFieldsData.valid );

        expect( tokenFields.scope ).toBe( 'adobeid' );
        expect( tokenFields.client_id ).toBe( 'IMSLibJSTestClient' );

    } );

    it( 'throw error if no token properties', () => {
        const tokenFieldsInfo = {
            ...tokenFieldsData,
            tokenValue: 'null'
        };

        expect( () => new TokenFields( tokenFieldsInfo, new Date( new Date().getTime() + ONE_HOUR_MS ) ) ).toThrowError( 'token cannot be decoded null' );

    } );
} );

describe( 'TokenFields validation', () => {

    it( 'invalid if expired', () => {
        const tokenFieldsInfo = {
            ...tokenFieldsData,
            tokenValue: TokenHelper.expiredToken()
        };

        const tokenFields: TokenFields = new TokenFields( tokenFieldsInfo, new Date( new Date().getTime() - ONE_HOUR_MS ) );

        expect( tokenFields.validate( 'adobeClientId', 'adobeIdScope' ) ).toBe( false );

    } );

    it( 'invalid if valid property is false', () => {
        const tokenFieldsInfo = {
            ...tokenFieldsData,
            valid: false
        };
        const tokenFields: TokenFields = new TokenFields( tokenFieldsInfo, new Date( new Date().getTime() + ONE_HOUR_MS ) );

        expect( tokenFields.validate( 'adobeClientId', 'adobeIdScope' ) ).toBe( false );

    } );

    it( 'invalid if adobeClientId != client_id', () => {
        const tokenFieldsInfo = {
            ...tokenFieldsData,
        };
        const tokenFields: TokenFields = new TokenFields( tokenFieldsInfo, new Date( new Date().getTime() + ONE_HOUR_MS ) );

        expect( tokenFields.validate( 'adobeClientId', 'adobeIdScope' ) ).toBe( false );

    } );

    it( 'invalid if token scope does not include expected \'adobeid\' scope', () => {
        const tokenFieldsInfo = TokenHelper.tokenFieldsDataWithScope( startDateTokenFields, 'someOtherScope' );

        const tokenFields: TokenFields = new TokenFields( 
            tokenFieldsInfo, 
            new Date( new Date().getTime() + ONE_HOUR_MS ) 
        );

        expect( tokenFields.validate( tokenFieldsInfo.client_id, 'adobeid' ) ).toBe( false );

    } );

    it( 'valid if token scope includes the expected \'adobeid\' scope, but also contains other scopes ', () => {
        const tokenFieldsInfo = TokenHelper.tokenFieldsDataWithScope( startDateTokenFields, 'someOtherScope,adobeid' );
        
        const tokenFields: TokenFields = new TokenFields( tokenFieldsInfo, new Date( new Date().getTime() + ONE_HOUR_MS ) );

        expect( tokenFields.validate( tokenFieldsInfo.client_id, 'adobeid' ) ).toBe( true );

    } );

    it( 'valid if all properties are good', () => {
        const tokenFieldsInfo = {
            ...tokenFieldsData,
        };
        const tokenFields: TokenFields = new TokenFields( tokenFieldsInfo, new Date( new Date().getTime() + ONE_HOUR_MS ) );

        expect( tokenFields.validate( tokenFieldsInfo.client_id, tokenFieldsInfo.scope ) ).toBe( true );

    } );

    it( 'create token fields from a IMSLib v1 structure', () => {
        const tokenFieldsInfo = {
            ...tokenFieldsData,
        };
        tokenFieldsInfo.access_token = tokenFieldsInfo.tokenValue;

        delete tokenFieldsInfo.tokenValue;

        const tokenFields: TokenFields = new TokenFields( tokenFieldsInfo, new Date( new Date().getTime() + ONE_HOUR_MS ) );

        expect( tokenFields.validate( tokenFieldsInfo.client_id, tokenFieldsInfo.scope ) ).toBe( true );

    } );

} );
