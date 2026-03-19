/**
 * ============================================
 * SERVICE: ResendEmailService
 * ============================================
 *
 * Adaptador de infraestructura que implementa IEmailService
 * usando el SDK oficial de Resend (https://resend.com).
 */

import { Resend } from 'resend';
import type {
  IEmailService,
  SendVerificationEmailOptions,
  SendPasswordResetEmailOptions,
} from '../../application/ports/email.service.port.js';
import { buildVerificationEmailHtml } from '../templates/email-verification.template.js';
import { buildPasswordResetEmailHtml } from '../templates/password-reset.template.js';

/**
 * Adaptador de Resend para envío de emails transaccionales.
 */
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;
  private readonly fromAddress: string;
  private readonly appName: string;

  constructor(apiKey: string, fromAddress: string, appName = 'Big School') {
    this.resend = new Resend(apiKey);
    this.fromAddress = fromAddress;
    this.appName = appName;
  }

  async sendVerificationEmail(options: SendVerificationEmailOptions): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: options.to,
      subject: `Verifica tu cuenta - ${this.appName}`,
      html: buildVerificationEmailHtml(options, this.appName),
    });
    if (error) {
      throw new Error(`Resend error sending verification email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(options: SendPasswordResetEmailOptions): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: options.to,
      subject: `Restablecer contraseña - ${this.appName}`,
      html: buildPasswordResetEmailHtml(options, this.appName),
    });
    if (error) {
      throw new Error(`Resend error sending password reset email: ${error.message}`);
    }
  }
}
