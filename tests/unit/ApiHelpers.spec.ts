import ApiHelpers from "../../src/api-helpers/ApiHelpers";

describe( "getCustomApiParameters", () => {

    it( 'getCustomApiParameters returns empty object', () => {

        const apiParameters = {
            test: 1,
        };
        const response = ApiHelpers.getCustomApiParameters( apiParameters, 'something' );
        expect( response ).toEqual( {} )

    } )


    it( 'getCustomApiParameters returns mathed key', () => {

        const apiParameters = {
            apiOne: 1,
            apiTwo: { day: 1 },
        };
        const response = ApiHelpers.getCustomApiParameters( apiParameters, 'apiTwo' );
        expect( response ).toEqual( { day:1 } )

    } )

} );

describe( "mergeExternalParameters", () => {

    it( 'mergeExternalParameters returns empty object', () => {

        const externalParameters = {};

        const apiParameters = {
            test: 1,
        };
        const response = ApiHelpers.mergeExternalParameters( externalParameters, apiParameters, 'something' );
        expect( response ).toEqual( {} )

    } )


    it( 'getCustomApiParameters returns merged object', () => {

        const externalParameters = { external: true, state: { some: 'external prop' } };
        const apiParameters = {
            keytest: 1,
            keyother: { day: 1, state: { some: 'default prop' } },
        };
        const response = ApiHelpers.mergeExternalParameters( externalParameters, apiParameters, 'keyother' );
        expect( response ).toEqual( {
            day:1,
            state: { some: 'external prop' },
            external: true
        } )

    } )

} );