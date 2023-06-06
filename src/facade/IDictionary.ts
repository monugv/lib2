

/**
 * Interface used as a replacement for any type in order to simulate an object type
 */
export interface IDictionary {
  [key: string]: string | number | boolean | object | null | IDictionary | Date;
}
