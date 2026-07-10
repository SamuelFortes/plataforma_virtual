"""Envio de e-mail transacional via API HTTP do Resend.

Usa httpx (já é dependência do projeto), sem SDK extra. Se as credenciais não
estiverem configuradas (ex.: ambiente de desenvolvimento), faz fallback: apenas
registra o conteúdo no log em vez de enviar — assim o fluxo não quebra localmente.

Variáveis de ambiente:
  EMAIL_API_KEY  -> API key do Resend (obrigatória para envio real)
  EMAIL_FROM     -> remetente verificado, ex.: "MeuTerritório <nao-responda@seudominio.com>"
"""
import logging
import os

import httpx

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"

EMAIL_API_KEY = os.getenv("EMAIL_API_KEY", "").strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", "MeuTerritório <onboarding@resend.dev>").strip()


async def _send_email(to: str, subject: str, html: str) -> bool:
    """Envia um e-mail. Retorna True se enviado, False se caiu no fallback/erro."""
    if not EMAIL_API_KEY:
        logger.warning(
            "EMAIL_API_KEY não configurada — e-mail NÃO enviado. "
            "Destinatário: %s | Assunto: %s\nConteúdo:\n%s",
            to, subject, html,
        )
        return False

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {EMAIL_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"from": EMAIL_FROM, "to": [to], "subject": subject, "html": html},
            )
        if resp.status_code >= 400:
            logger.error("Falha ao enviar e-mail (%s): %s", resp.status_code, resp.text)
            return False
        logger.info("E-mail enviado para %s (assunto: %s)", to, subject)
        return True
    except Exception as exc:  # rede/timeout — não deve derrubar a requisição
        logger.error("Erro ao enviar e-mail para %s: %s", to, exc)
        return False


async def send_password_reset_email(to: str, reset_link: str) -> bool:
    """Envia o e-mail de recuperação de senha com o link de redefinição."""
    subject = "Recuperação de senha — MeuTerritório"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #0e7490;">Recuperação de senha</h2>
      <p>Recebemos um pedido para redefinir a senha da sua conta no <strong>MeuTerritório</strong>.</p>
      <p>Clique no botão abaixo para criar uma nova senha. O link expira em 30 minutos.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="{reset_link}"
           style="background: #0891b2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
          Redefinir minha senha
        </a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        Se o botão não funcionar, copie e cole este endereço no navegador:<br>
        <a href="{reset_link}">{reset_link}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="font-size: 12px; color: #9ca3af;">
        Se você não solicitou a redefinição, ignore este e-mail — sua senha continua a mesma.
      </p>
    </div>
    """
    return await _send_email(to, subject, html)
