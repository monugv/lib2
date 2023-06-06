const SCOPE_SEPARATOR = ',';

export function sortScopes ( scopes: string ): string {
    return scopes.split( SCOPE_SEPARATOR ).sort().join( SCOPE_SEPARATOR );
}

export function validateScopeInclusion ( 
    requestedScope: string, 
    tokenScope: string 
): boolean {
    const tokenScopes = tokenScope?.split( SCOPE_SEPARATOR ) || [];
    const requestedScopes = requestedScope?.split( SCOPE_SEPARATOR ) || [];
    return requestedScopes.every( scope => tokenScopes.includes( scope ) ); 
}