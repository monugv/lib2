import { isObject, merge } from "../../src/util/ObjectUtil";

describe( 'ObjectUtil -> isObject', () => {

    it( 'returns true on normal object ', () => {
        expect( isObject( { foo:'bar' } ) ).toBeTrue();
    } );

    it( 'returns false on primitive ', () => {
        expect( isObject( 'foo' ) ).toBeFalse();
    } );

    it ( 'returns false on null object ', () => { 
        expect( isObject( null ) ).toBeFalse();
    } );

    it ( 'returns false on undefined object ', () => { 
        expect( isObject( undefined ) ).toBeFalse();
    } );
} )

describe( 'ObjectUtil -> merge', () => {

    it( 'merges two objects without overlaps', () => {
        expect( merge( { foo:'bar' }, { moo: 'har' } ) ).toEqual( { foo:'bar', moo: 'har' } );
    } );

    it( 'deep merges two objects with overlaps', () => {
        expect( merge ( { foo: { bar: 'sup' }, baz: 'yollo' }, { foo: { bar: 'yo', moo: 'har' } } ) )
            .toEqual( { foo: { bar: 'yo', moo: 'har' }, baz: 'yollo' } );
    } );

    it( 'merges with null object', () => {
        expect( merge ( { foo: 'bar' }, null ) ).toEqual( { foo:'bar' } );
    } )

    it( 'merges with undefined object', () => {
        expect( merge ( { foo: 'bar' }, undefined ) ).toEqual( { foo:'bar' } );
    } )

    it( 'merges on non-object', () => {
        expect( merge ( 'foo', { baz: 'yollo' } ) ).toEqual( 'foo' );
    } )

    it( 'merges with non-object', () => {
        expect( merge ( { foo:'bar' }, 'baz' ) ).toEqual( { foo:'bar' } );
    } )

    it( 'merges on null object', () => {
        expect( merge ( null, { foo: 'bar' } ) ).toEqual( { foo: 'bar' } );
    } )

    it( 'merges on undefined object', () => {
        expect( merge ( undefined, { foo: 'bar' } ) ).toEqual( { foo: 'bar' } );
    } )
} )
