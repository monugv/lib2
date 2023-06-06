/**
 * Base32 decoding module.
 * It uses the alphabet defined in {@link https://tools.ietf.org/html/rfc4648#page-9|RFC 4648}
*/
const alphabet = 'abcdefghijklmnopqrstuvwxyz234567'.split( '' );
const indexTable = alphabet.reduce( ( acc, curr, idx ) => {
    acc[curr] = idx;
    return acc;
}, { '=': 0 } );
  
/**
     * Pads the string with the given char until the required length
     *
     * @param  {!string} ch The character used to pad
     * @param  {!number} num The required string length
     * @param  {!string} str The starting string to pad
     * @return {!string}
     */
const leftPad = ( ch, num, str ): string => {
    const charsNeeded = num - str.length;
    if ( charsNeeded > 0 ) {
        // +1 here because we're using join
        str = new Array( charsNeeded + 1 ).join( ch ) + str;
    }
  
    return str;
}
  
/**
     * Converts a number to a string representation of it in binary and
     * pads it with 0s until it's 5 bits in length.
     *
     * @param  {!number} num The number
     * @return {!string} The padded binary string
     */
const toBase32PaddedBinary = ( num: number ): string => {
    return leftPad( '0', 5, num.toString( 2 ) );
}
  
const validateEncodedData = ( chars ): void =>  {
    if ( chars.length % 8 !== 0 ) {
        throw new Error( 'Data length is not a multiple of 8' );
    }
  
    chars.forEach( function ( ch ) {
        if ( !( ch in indexTable ) ) {
            throw new Error( 'Unknown encoded character ' + ch );
        }
    } );
  
    let foundPaddingChar = false;
    chars.forEach( function ( ch ) {
        if ( ch !== '=' && foundPaddingChar ) {
            throw new Error( 'Found padding char in the middle of the string' );
        } else if ( ch === '=' ) {
            foundPaddingChar = true;
        }
    } );
}
  
const countPadding = ( chars ): number => {
    let idx = chars.length - 1;
    let count = 0;
  
    while ( chars[idx] === '=' ) {
        ++count;
        --idx;
    }
  
    return count;
}
  
/**
   * Converts every byte in a bitstring to it's least-significant-bit representation
   *
   * @example
   * var bitstring = '00000111';
   * bitstringToLSB(bitstring); // => '11100000'
   *
   * @param  {string} bitstring A string of 0s and 1s
   * @return {string} The LSB representation of the bitstring
   */
const bitstringToLSB = ( bitstring ): string => {
    const BYTE_LENGTH = 8;
    let result = '';

    if ( bitstring.length % 8 !== 0 ) {
        throw new Error( 'Length must be a multiple of 8' );
    }

    for ( let byteStart = 0, len = bitstring.length; byteStart < len; byteStart += BYTE_LENGTH ) {
        const byte = bitstring.slice( byteStart, byteStart + BYTE_LENGTH );
        result += byte.split( '' ).reverse().join( '' );
    }

    return result;
}

/**
     * Decodes a base32-encoded string to a bitstring.
     *
     * The function uses the base32 alphabet defined in {@link https://tools.ietf.org/html/rfc4648#page-9|RFC 4648}.
     * This function does not take into account character aliases.
     *
     * @param  {!string} str The base32-encode data
     * @return {!string} A bitstring of the decoded data
     *
     * @throws {Error} If the data contains non-base32 characters
     *
     * @memberof module:base32
     * @public
     */
export const decodeToBitstring = ( str: string, lsb = false ): string => {
    /* Decoding algorithm
       * 1. validate data (length is multiple of 8, no unknown chars, padding is at the end)
       * 2. convert data to binary based on the lookup table
       * 3. remove extraneous 0s added from padding
       *   3.1. remove five 0s for each padding char =
       *   3.2. remove a 0 until data.length is a multiple of 8
       */
  
    if ( typeof str !== 'string' ) {
        throw new Error( 'Data is not a string' );
    }
  
    const chars = str.toLowerCase().split( '' );
    validateEncodedData( chars );
  
    const paddingCount = countPadding( chars );
  
    const binary: string[] = [];
    chars.forEach(  ( ch ) => {
        binary.push( toBase32PaddedBinary( indexTable[ch] ) );
    } );
  
    let data = binary.join( '' );
  
    // remove padding:
    // five 0s for each `=`
    if ( paddingCount > 0 ) {
        data = data.slice( 0, -5 * paddingCount );
    }
  
    // remove all the 0s until data.length is dividable by 8
    if ( data.length % 8 !== 0 ) {
        data = data.slice( 0, -1 * ( data.length % 8 ) );
    }
  
    return lsb ? bitstringToLSB( data ): data;
}
  
