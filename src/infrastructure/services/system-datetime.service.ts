/**
 * ============================================
 * SERVICE: SystemDateTimeService
 * ============================================
 *
 * Implementación del IDateTimeService usando Date del sistema.
 * Proporciona abstracción del reloj para testabilidad.
 *
 * RESPONSABILIDADES:
 * - Obtener fecha/hora actual
 * - Calcular fechas futuras
 * - Formatear y parsear fechas
 *
 * TESTABILIDAD:
 * En tests, usar MockDateTimeService que permite
 * controlar el tiempo.
 */

import { IDateTimeService } from '../../application/ports/datetime.service.port.js';

/**
 * Implementación de IDateTimeService usando el reloj del sistema.
 */
export class SystemDateTimeService implements IDateTimeService {
  /**
   * Obtiene la fecha y hora actual del sistema.
   */
  public now(): Date {
    return new Date();
  }

  /**
   * Obtiene el timestamp actual en milisegundos.
   */
  public nowTimestamp(): number {
    return Date.now();
  }

  /**
   * Obtiene el timestamp actual en segundos.
   */
  public nowTimestampSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Calcula una fecha futura sumando segundos.
   */
  public addSeconds(seconds: number): Date {
    const date = this.now();
    date.setSeconds(date.getSeconds() + seconds);
    return date;
  }

  /**
   * Calcula una fecha futura sumando minutos.
   */
  public addMinutes(minutes: number): Date {
    const date = this.now();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  /**
   * Calcula una fecha futura sumando horas.
   */
  public addHours(hours: number): Date {
    const date = this.now();
    date.setHours(date.getHours() + hours);
    return date;
  }

  /**
   * Calcula una fecha futura sumando días.
   */
  public addDays(days: number): Date {
    const date = this.now();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * Verifica si una fecha ha expirado (es pasada).
   */
  public isExpired(date: Date): boolean {
    return this.now() > date;
  }

  /**
   * Calcula la diferencia en segundos entre dos fechas.
   */
  public differenceInSeconds(from: Date, to: Date): number {
    return Math.floor((to.getTime() - from.getTime()) / 1000);
  }

  /**
   * Formatea una fecha a ISO 8601.
   */
  public toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Parsea una fecha desde string ISO 8601.
   */
  public fromISOString(isoString: string): Date | null {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
  }
}
