/**
 * class used to store the authorization code fields
 */
export class AuthorizationCode {

       /**
        * represents the client id associated with this token fields
        */
       client_id = '';

       /**
        * represents the scope used to retrieve the token
        */
       scope = '';

       /**
        * represents the code recived during the authorization
        */
       code = '';

      
       /**
        * represents the state used during initialize
        */
       state: any = null;

       /**
        * represents the code_verifier used to generate the code_challenge (used during authorization flow)
        */
       code_verifier = '';


       /**
        * represents the other properties from url
        */
       other: any = null;
       /**
        * this class is used to create a AuthorizationCode instance based on authorization server response 
        * @param authProps {object} represents the authorization server response 
        */
       constructor ( authProps: any ) {
           const { code, state, client_id, scope, verifier, ...other } = authProps;

           this.state = state;
           this.client_id = client_id;
           this.code = code;
           this.scope = scope;
           this.code_verifier = verifier;
           this.other = other;
       }
}