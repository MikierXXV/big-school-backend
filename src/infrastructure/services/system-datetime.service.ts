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
const TIMEZONE = 'Europe/Madrid';

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

  /**
   * Formatea una fecha en la zona horaria Europe/Madrid.
   * Produce formato ISO 8601 con offset: "2026-02-16T15:30:45.000+01:00"
   */
  public toLocalString(date?: Date): string {
    const d = date ?? this.now();

    // Get date parts in Europe/Madrid timezone
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      fractionalSecondDigits: 3,
    }).formatToParts(d);

    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';

    const dateStr = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.${get('fractionalSecond')}`;

    // Calculate UTC offset for Europe/Madrid at this specific date
    const utcMs = d.getTime();
    const localDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const offsetMs = localDate.getTime() - utcMs;
    const offsetMin = Math.round(offsetMs / 60000);
    const sign = offsetMin >= 0 ? '+' : '-';
    const absMin = Math.abs(offsetMin);
    const offsetHours = String(Math.floor(absMin / 60)).padStart(2, '0');
    const offsetMins = String(absMin % 60).padStart(2, '0');

    return `${dateStr}${sign}${offsetHours}:${offsetMins}`;
  }
}
