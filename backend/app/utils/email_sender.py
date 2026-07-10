"""Envio de e-mail transacional.

Suporta dois transportes, escolhidos automaticamente pelas variáveis de ambiente:

1. SMTP (ex.: Gmail) — se SMTP_HOST/SMTP_USER/SMTP_PASSWORD estiverem definidos.
   Usa smtplib da biblioteca padrão (sem dependência extra), rodando em thread
   para não bloquear o event loop async.
2. Resend (API HTTP) — se EMAIL_API_KEY estiver definido (e SMTP não).

Se nenhum estiver configurado (ex.: dev), faz fallback: apenas registra o
conteúdo no log em vez de enviar — assim o fluxo não quebra localmente.

Variáveis de ambiente:
  # SMTP (Gmail: use uma "senha de app", exige verificação em 2 etapas na conta)
  SMTP_HOST      -> ex.: smtp.gmail.com
  SMTP_PORT      -> ex.: 587 (STARTTLS)
  SMTP_USER      -> e-mail que autentica e envia, ex.: suaconta@gmail.com
  SMTP_PASSWORD  -> senha de app (16 caracteres)
  # Resend (alternativa)
  EMAIL_API_KEY  -> API key do Resend
  # Comum
  EMAIL_FROM     -> remetente exibido; se ausente, usa SMTP_USER
"""
import asyncio
import logging
import os
import smtplib
import socket
from email.message import EmailMessage

import httpx

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"

SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()

EMAIL_API_KEY = os.getenv("EMAIL_API_KEY", "").strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", "").strip() or SMTP_USER or "onboarding@resend.dev"


def _send_via_smtp_sync(to: str, subject: str, html: str) -> None:
    """Envio SMTP bloqueante — chamado dentro de asyncio.to_thread."""
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to
    msg.set_content("Seu cliente de e-mail não suporta HTML. Abra em um navegador.")
    msg.add_alternative(html, subtype="html")

    # Containers do Render (e afins) costumam NÃO ter rota IPv6 de saída. Como o
    # smtp.gmail.com resolve para IPv6 por padrão, o smtplib tenta o endereço IPv6
    # e falha com "[Errno 101] Network is unreachable". Resolvemos manualmente o
    # endereço IPv4 (registro A) e conectamos por ele, mantendo o hostname original
    # para que a validação do certificado TLS no STARTTLS continue funcionando.
    ipv4 = socket.getaddrinfo(SMTP_HOST, SMTP_PORT, socket.AF_INET, socket.SOCK_STREAM)[0][4][0]
    with smtplib.SMTP(ipv4, SMTP_PORT, timeout=20) as server:
        server._host = SMTP_HOST  # server_hostname usado pelo STARTTLS (certificado)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)


async def _send_email(to: str, subject: str, html: str) -> bool:
    """Envia um e-mail pelo transporte configurado. True se enviado, False caso contrário."""
    # 1. SMTP (Gmail e afins)
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            await asyncio.to_thread(_send_via_smtp_sync, to, subject, html)
            logger.info("E-mail (SMTP) enviado para %s (assunto: %s)", to, subject)
            return True
        except Exception as exc:
            logger.error("Erro ao enviar e-mail via SMTP para %s: %s", to, exc)
            return False

    # 2. Resend (API HTTP)
    if EMAIL_API_KEY:
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
                logger.error("Falha ao enviar e-mail via Resend (%s): %s", resp.status_code, resp.text)
                return False
            logger.info("E-mail (Resend) enviado para %s (assunto: %s)", to, subject)
            return True
        except Exception as exc:
            logger.error("Erro ao enviar e-mail via Resend para %s: %s", to, exc)
            return False

    # 3. Fallback: sem transporte configurado — apenas loga
    logger.warning(
        "Nenhum transporte de e-mail configurado (SMTP_* ou EMAIL_API_KEY) — "
        "e-mail NÃO enviado. Destinatário: %s | Assunto: %s\nConteúdo:\n%s",
        to, subject, html,
    )
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
