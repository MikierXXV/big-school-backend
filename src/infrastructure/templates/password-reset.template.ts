/**
 * ============================================
 * TEMPLATE: Password Reset
 * ============================================
 *
 * Template HTML para el email de recuperación de contraseña.
 */

import type { SendPasswordResetEmailOptions } from '../../application/ports/email.service.port.js';

/**
 * Genera el HTML del email de recuperación de contraseña.
 */
export function buildPasswordResetEmailHtml(options: SendPasswordResetEmailOptions, appName: string): string {
  const { firstName, resetLink } = options;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer contraseña - ${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb;padding:32px 40px;text-align:center;">
              <svg width="44" height="44" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 12px;">
                <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)"/>
                <rect x="13" y="6" width="6" height="20" rx="2" fill="white"/>
                <rect x="6" y="13" width="20" height="6" rx="2" fill="white"/>
              </svg>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${appName}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">
                Hola, ${firstName}!
              </h2>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en ${appName}.
              </p>
              <p style="margin:0 0 32px;color:#374151;font-size:16px;line-height:1.6;">
                Haz clic en el siguiente botón para crear una nueva contraseña:
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background-color:#dc2626;border-radius:6px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:6px;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;line-height:1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 32px;word-break:break-all;">
                <a href="${resetLink}" style="color:#2563eb;font-size:14px;">${resetLink}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
                Este enlace es válido durante <strong>30 minutos</strong>. Si no solicitaste este cambio, ignora este mensaje. Tu contraseña actual permanece segura.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">
                &copy; ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
