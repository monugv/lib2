/* eslint-disable @typescript-eslint/camelcase */

import CryptoJS from 'crypto-js';

/**
 * class used only for tests in order to generate valid tokens
 */
class TokenHelper {

  CLIENT_ID = 'IMSLibJSTestClient';

  private tokenProps = {
      scope: 'adobeid',
      client_id: this.CLIENT_ID,
      expires_in: '30001',
      tokenValue: ''
  };

  tokenFieldsData ( createdAt: Date ): any {
      return {
          ...this.tokenProps,
          tokenValue: this.defaultToken( createdAt )
      };
  }

  tokenFieldsDataWithScope ( createdAt: Date, scope: string ): any {
      return {
          ...this.tokenProps,
          scope,
          tokenValue: this.tokenWithScope( createdAt, scope )
      }
  }

  // Defining our token parts
  private header = {
      alg: "HS256",
      typ: "JWT"
  };

  private secret = "Don't tell anyone!!!";

  private base64url ( source: any ): string {
      // Encode in classical base64
      let encodedSource = CryptoJS.enc.Base64.stringify( source );

      // Remove padding equal characters
      encodedSource = encodedSource.replace( /=+$/, '' );

      // Replace characters according to base64url specifications
      encodedSource = encodedSource.replace( /\+/g, '-' );
      encodedSource = encodedSource.replace( /\//g, '_' );

      return encodedSource;
  }

  private encode ( data: any ): string {
      const stringifiedHeader = CryptoJS.enc.Utf8.parse( JSON.stringify( this.header ) );
      const encodedHeader = this.base64url( stringifiedHeader );

      const stringifiedData = CryptoJS.enc.Utf8.parse( JSON.stringify( data ) );
      const encodedData = this.base64url( stringifiedData );

      const signature = encodedHeader + "." + encodedData;
      const encryptedSignature = CryptoJS.HmacSHA256( signature, this.secret );
      const encryptedSignatureStr = this.base64url( encryptedSignature );

      return `${ encodedHeader }.${ encodedData }.${ encryptedSignatureStr }`;

  }

  /**
   * generate a new token based on the input data
   * @param client_id {String}
   * @param user_id {String}
   * @param scope
   * @param created_at
   * @param expires_in
   * @param valid
   * @param other
   * @param imp_id
   * @param imp_sid
   * @param pba
   */
  generateToken ( client_id: string, user_id: string, scope: string, created_at: string, expires_in: string, valid: boolean, other: any, imp_id?: string, imp_sid?: string, pba?: string ): string {
      let data: any = {
          client_id, user_id, scope, created_at, expires_in, valid, sid: 'session_identifier', other
      };

      if ( imp_id && imp_sid ) {
          data = { ...data, imp_id, imp_sid }
      }

      if ( pba ) {
          data = { ...data, pba }
      }

      return this.encode( data );
  }

  defaultToken ( createdAt: Date ): string {
      return this.generateToken( this.CLIENT_ID, 'user_id', 'adobeid', createdAt.getTime().toString(), '30001', true, {} );
  }

  tokenWithScope ( createdAt: Date, scope: string ): string {
      return this.generateToken( this.CLIENT_ID, 'user_id', scope, createdAt.getTime().toString(), '30001', true, {} );
  }

  tokenForClient2 ( createdAt: Date, clientId = 'IMSLibJSTestClient2' ): string {
      return this.generateToken( clientId, 'user_id', 'adobeid', createdAt.getTime().toString(), '30001', true, {} );
  }

  reauthToken ( createdAt: Date ): string {
      return this.generateToken( this.CLIENT_ID, 'user_id', 'adobeid,reauthenticated', createdAt.getTime().toString(), '30001', true, {} );
  }

  expiredToken (): string {
      const createdAt = new Date().getTime().toString();
      return this.generateToken( this.CLIENT_ID, 'user_id', 'adobeid,reauthenticated', createdAt, '-30001', true, {} );
  }

  impersonatedToken ( createdAt: Date ): string {
      return this.generateToken( this.CLIENT_ID, 'user_id', 'adobeid', createdAt.getTime().toString(), '30001', true, {}, 'impersonator_id', 'impersonatedSession_id' );
  }

  tokenWithPba ( pbaPolicies = '' ): string {
      return this.generateToken( this.CLIENT_ID, 'user_id', 'adobeid', Date.now().toString(), '30001', true, {}, '', '', pbaPolicies );
  }

}

export default new TokenHelper();
