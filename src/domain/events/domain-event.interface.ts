/**
 * ============================================
 * INTERFACE: DomainEvent
 * ============================================
 *
 * Interfaz base para todos los eventos de dominio.
 * Define la estructura común que todos los eventos deben tener.
 *
 * PRINCIPIOS:
 * - Los eventos son inmutables
 * - Representan hechos pasados (ya ocurrieron)
 * - Contienen toda la información necesaria para procesarlos
 * - Son serializables (para persistencia y messaging)
 */

/**
 * Interfaz base para eventos de dominio.
 * Todos los eventos específicos deben implementar esta interfaz.
 */
export interface IDomainEvent {
  /**
   * ID único del evento.
   * Formato recomendado: UUID v4
   */
  readonly eventId: string;

  /**
   * Nombre del evento.
   * Formato: PascalCase, pasado (UserRegistered, LoginSucceeded)
   */
  readonly eventName: string;

  /**
   * Versión del schema del evento.
   * Útil para migración de datos en Event Sourcing.
   */
  readonly eventVersion: number;

  /**
   * Fecha y hora exacta en que ocurrió el evento.
   */
  readonly occurredOn: Date;

  /**
   * ID del agregado que emitió el evento.
   */
  readonly aggregateId: string;

  /**
   * Tipo del agregado que emitió el evento.
   * Ejemplo: 'User', 'Session'
   */
  readonly aggregateType: string;

  /**
   * Payload específico del evento.
   * Contiene los datos relevantes del evento.
   */
  readonly payload: Record<string, unknown>;

  /**
   * Metadatos adicionales del evento.
   * Útil para auditoría, tracing, etc.
   */
  readonly metadata?: EventMetadata;
}

/**
 * Metadatos opcionales del evento.
 */
export interface EventMetadata {
  /**
   * ID de correlación para tracing distribuido.
   */
  readonly correlationId?: string;

  /**
   * ID del evento que causó este evento.
   */
  readonly causationId?: string;

  /**
   * ID del usuario que realizó la acción.
   */
  readonly userId?: string;

  /**
   * IP del cliente (para auditoría).
   */
  readonly clientIp?: string;

  /**
   * User-Agent del cliente.
   */
  readonly userAgent?: string;

  /**
   * Timestamp del servidor.
   */
  readonly serverTimestamp?: Date;
}

/**
 * Clase abstracta base para implementar eventos de dominio.
 * Proporciona funcionalidad común.
 */
export abstract class BaseDomainEvent implements IDomainEvent {
  public abstract readonly eventName: string;
  public abstract readonly aggregateType: string;
  public abstract readonly payload: Record<string, unknown>;

  public readonly eventId: string;
  public readonly eventVersion: number;
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly metadata?: EventMetadata;

  /**
   * Constructor del evento base.
   *
   * @param eventId - ID único del evento
   * @param aggregateId - ID del agregado
   * @param occurredOn - Fecha del evento
   * @param eventVersion - Versión del schema
   * @param metadata - Metadatos opcionales
   */
  protected constructor(
    eventId: string,
    aggregateId: string,
    occurredOn: Date,
    eventVersion: number = 1,
    metadata?: EventMetadata
  ) {
    this.eventId = eventId;
    this.aggregateId = aggregateId;
    this.occurredOn = occurredOn;
    this.eventVersion = eventVersion;
    this.metadata = metadata;
  }

  /**
   * Serializa el evento a JSON.
   * @returns Objeto serializable
   */
  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      payload: this.payload,
      metadata: this.metadata,
    };
  }
}

/**
 * Interfaz para el dispatcher de eventos.
 * Definido en dominio, implementado en infraestructura.
 */
export interface IDomainEventDispatcher {
  /**
   * Despacha un evento a sus handlers.
   * @param event - Evento a despachar
   */
  dispatch(event: IDomainEvent): Promise<void>;

  /**
   * Despacha múltiples eventos en orden.
   * @param events - Array de eventos
   */
  dispatchAll(events: IDomainEvent[]): Promise<void>;
}

/**
 * Interfaz para handlers de eventos.
 */
export interface IDomainEventHandler<T extends IDomainEvent = IDomainEvent> {
  /**
   * Nombre del evento que maneja.
   */
  readonly eventName: string;

  /**
   * Procesa el evento.
   * @param event - Evento a procesar
   */
  handle(event: T): Promise<void>;
}
