
/**
 * Wrapper for <code>console</code>. Checks <code>console</code> is available and <code>debug</code> Mode is enabled.
 *
 * @exports log
 *
 */
class Log {

  private logEnabled = false;
  enableLogging (): void {
      this.logEnabled = true;
  }

  disableLogging (): void {
      this.logEnabled = false;
  }

  /**
   * Wrapper function.
   *
   * @param {String} method - Which <code>console</code> method to use.
   * @param {*} args - Arguments object
   *
   * @private
   */
  print = ( method: Function, args: any ): void => {
      if ( !this.logEnabled ) {
          return;
      }
      method( ...args );
  };

  /**
   * Writes an error to the console when the evaluated expression is false.
   *
   * @example
   * log.assert(1 == 2, "Counting is hard.");
   *
   * @param {Boolean} expression - Expression to evaluate.
   * @param {String} message - Message to print if <code>epxression</code> is <code>false</code>.
   *
   * @static
   */
  assert = ( val: boolean | string, message: string | any ): void => {
      this.print( console.assert, [ val, message ] );
  };

  /**
   * Writes an error to the console when the evaluated expression is false.
   *
   * @example
   * log.assert(1 == 2, "Counting is hard.");
   *
   * @param {Boolean} expression - Expression to evaluate.
   * @param {String} message - Message to print if <code>epxression</code> is <code>false</code>.
   *
   * @static
   */
  assertCondition = ( condition: Function, message: string | any ): void => {
      if ( !condition() ) {
          this.print( console.error, [ message ] );
      }
  };

  /**
   * Prints a message similar to <code>console.log()</code>, styles the message like an error, and includes a stack
   * trace from where the method wasval, called.
   *
   * @see {@link https://developers.google.com/web/tools/chrome-devtools/console/#filtering_the_console_output | Filtering the Console output}
   *
   * @example
   * log.error("Define window.adobeid", "would you?!");
   * @param {String} message - Message to print.
   */
  error = ( ...args: any[] ): void => {
      this.print( console.error, args );
  };

  /**
   * logs a warnig message
   */
  warn = ( ...args: any[] ): void => {
      this.print( console.warn, args );
  };

  /**
   * Prints a message like <code>console.log()</code> but also shows an icon (blue circle with white "i") next to the
   * output.
   *
   * <code>console.info()</code> can be filtered in the Console, whereas <code>console.log()</code> can not.
   *
   * @example
   * log.info("Imslib.js Ready", "to Rumble");
   *
   * @param {String} message - Message to print.
   *
   * @static
   */
  info = ( ...args: any[] ): void => {
      this.print( console.info, args );
  };
  
}

export default new Log();
