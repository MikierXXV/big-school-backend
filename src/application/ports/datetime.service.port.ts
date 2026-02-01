/**
 * ============================================
 * PORT: DateTimeService
 * ============================================
 *
 * Define el contrato para el servicio de fecha y hora.
 * Abstrae el acceso al reloj del sistema para testabilidad.
 *
 * RESPONSABILIDADES:
 * - Obtener la fecha/hora actual
 * - Calcular fechas de expiración
 * - Formatear fechas
 * - Parsear fechas
 *
 * ¿POR QUÉ ABSTRAER LA FECHA?
 * - Testabilidad: Permite controlar el tiempo en tests
 * - Consistencia: Un único punto de acceso al reloj
 * - Timezone: Manejo centralizado de zonas horarias
 *
 * IMPLEMENTACIONES POSIBLES:
 * - SystemDateTimeService (usa Date de sistema)
 * - MockDateTimeService (para tests)
 */

/**
 * Port del servicio de fecha/hora.
 * Implementado en infraestructura.
 */
export interface IDateTimeService {
  /**
   * Obtiene la fecha y hora actual.
   * @returns Fecha actual del sistema
   *
   * TODO: Implementar en SystemDateTimeService
   */
  now(): Date;

  /**
   * Obtiene el timestamp actual en milisegundos.
   * @returns Unix timestamp en ms
   *
   * TODO: Implementar en SystemDateTimeService
   */
  nowTimestamp(): number;

  /**
   * Obtiene el timestamp actual en segundos.
   * @returns Unix timestamp en segundos
   *
   * TODO: Implementar en SystemDateTimeService
   */
  nowTimestampSeconds(): number;

  /**
   * Calcula una fecha futura sumando segundos.
   *
   * @param seconds - Segundos a sumar
   * @returns Fecha futura
   *
   * CASO DE USO: Calcular expiración de tokens
   * - Access Token: now() + 18000 (5 horas)
   * - Refresh Token: now() + 259200 (3 días)
   *
   * TODO: Implementar en SystemDateTimeService
   */
  addSeconds(seconds: number): Date;

  /**
   * Calcula una fecha futura sumando minutos.
   *
   * @param minutes - Minutos a sumar
   * @returns Fecha futura
   *
   * TODO: Implementar en SystemDateTimeService
   */
  addMinutes(minutes: number): Date;

  /**
   * Calcula una fecha futura sumando horas.
   *
   * @param hours - Horas a sumar
   * @returns Fecha futura
   *
   * TODO: Implementar en SystemDateTimeService
   */
  addHours(hours: number): Date;

  /**
   * Calcula una fecha futura sumando días.
   *
   * @param days - Días a sumar
   * @returns Fecha futura
   *
   * TODO: Implementar en SystemDateTimeService
   */
  addDays(days: number): Date;

  /**
   * Verifica si una fecha ha expirado.
   *
   * @param date - Fecha a verificar
   * @returns true si la fecha es pasada
   *
   * TODO: Implementar en SystemDateTimeService
   */
  isExpired(date: Date): boolean;

  /**
   * Calcula la diferencia en segundos entre dos fechas.
   *
   * @param from - Fecha inicial
   * @param to - Fecha final
   * @returns Diferencia en segundos (positivo si to > from)
   *
   * TODO: Implementar en SystemDateTimeService
   */
  differenceInSeconds(from: Date, to: Date): number;

  /**
   * Formatea una fecha a ISO 8601.
   *
   * @param date - Fecha a formatear
   * @returns String en formato ISO
   *
   * TODO: Implementar en SystemDateTimeService
   */
  toISOString(date: Date): string;

  /**
   * Parsea una fecha desde string ISO 8601.
   *
   * @param isoString - String en formato ISO
   * @returns Date o null si es inválido
   *
   * TODO: Implementar en SystemDateTimeService
   */
  fromISOString(isoString: string): Date | null;
}

/**
 * Símbolo para inyección de dependencias.
 */
export const DATETIME_SERVICE = Symbol('IDateTimeService');
