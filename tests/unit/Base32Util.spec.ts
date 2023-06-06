import { decodeToBitstring } from "../../src/util/Base32Util";

const BASE_32 = "IJQXGZJTGIQFIZLTOQ======";
const DECODED = "0100001001100001011100110110010100110011001100100010000001010100011001010111001101110100";
const LSB_DECODED = "0100001010000110110011101010011011001100010011000000010000101010101001101100111000101110";

describe( 'Base32Util -> decodeToBitString', () => {

    it( 'returns correct bitstring ', () => {
        expect( decodeToBitstring( BASE_32 ) ).toEqual( DECODED );
    } );

    it( 'returns correct bitstring, LSB ', () => {
        expect( decodeToBitstring( BASE_32, true ) ).toEqual( LSB_DECODED );
    } );

    it( 'throws error for invalid length ', () => {
        expect( () => decodeToBitstring( 'abc' ) ).toThrow( new Error( 'Data length is not a multiple of 8' ) );
    } );

    it( 'throws error for invalid char ', () => {
        expect( () => decodeToBitstring( 'aaaaaa((' ) ).toThrow( new Error( 'Unknown encoded character (' ) );
    } );

    it( 'throws error for padding char in the middle of string ', () => {
        expect( () => decodeToBitstring( 'a=aaaaaa' ) ).toThrow( new Error( 'Found padding char in the middle of the string' ) );
    } );

} )