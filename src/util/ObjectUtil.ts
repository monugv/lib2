// proudly found here: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject ( item: any ): boolean {
    return ( item !== null && item !== undefined && typeof item === 'object' && !Array.isArray( item ) );
}

/**
   * Deep merge two objects.
   * @param target
   * @param source
   */

  
export function merge ( target: any, source: any ): any {

    if( target === null || target === undefined ) {
        return source;
    }

    if( target === source ) {
        return target;
    }

    if( !isObject( target ) ) {
        return target;
    }
    
    const output = Object.assign( {}, target );
    if ( isObject( source ) ) {
        Object.keys( source ).forEach( key => {
            if ( isObject( source[key] ) ) {
                if ( !( key in target ) )
                    Object.assign( output, { [key]: source[key] } );
                else
                    output[key] = merge( target[key], source[key] );
            } else {
                Object.assign( output, { [key]: source[key] } );
            }
        } );
    }
    return output;
}