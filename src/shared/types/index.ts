/**
 * ============================================
 * SHARED TYPES
 * ============================================
 *
 * Tipos utilitarios compartidos.
 */

/**
 * Hace todas las propiedades de T opcionales excepto las listadas en K.
 */
export type RequireOnly<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Hace todas las propiedades de T requeridas.
 */
export type RequireAll<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Extrae el tipo de los elementos de un array.
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Tipo para resultados de operaciones que pueden fallar.
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Tipo para funciones asíncronas.
 */
export type AsyncFunction<T = void> = () => Promise<T>;

/**
 * Tipo para objetos con claves string y valores de tipo T.
 */
export type Dictionary<T> = Record<string, T>;

/**
 * Tipo que excluye null y undefined.
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Tipo para hacer propiedades inmutables (deeply).
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Tipo para valores que pueden ser una promesa o no.
 */
export type MaybePromise<T> = T | Promise<T>;
