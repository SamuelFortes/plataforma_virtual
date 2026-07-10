"""Envio de e-mail transacional.

Suporta três transportes, escolhidos automaticamente pelas variáveis de ambiente
(nesta ordem de prioridade):

1. Brevo (API HTTP) — se BREVO_API_KEY estiver definido. Recomendado em produção
   no Render: usa HTTPS (porta 443), que não é bloqueado como as portas de SMTP.
2. SMTP (ex.: Gmail) — se SMTP_HOST/SMTP_USER/SMTP_PASSWORD estiverem definidos.
   Usa smtplib da biblioteca padrão (sem dependência extra), rodando em thread
   para não bloquear o event loop async. OBS.: o plano free do Render bloqueia
   as portas de SMTP (25/465/587), então SMTP só funciona em plano pago.
3. Resend (API HTTP) — se EMAIL_API_KEY estiver definido.

Se nenhum estiver configurado (ex.: dev), faz fallback: apenas registra o
conteúdo no log em vez de enviar — assim o fluxo não quebra localmente.

Variáveis de ambiente:
  # Brevo (verifique o e-mail remetente no painel; não exige domínio próprio)
  BREVO_API_KEY  -> API key (v3) do Brevo
  # SMTP (Gmail: use uma "senha de app", exige verificação em 2 etapas na conta)
  SMTP_HOST      -> ex.: smtp.gmail.com
  SMTP_PORT      -> ex.: 587 (STARTTLS)
  SMTP_USER      -> e-mail que autentica e envia, ex.: suaconta@gmail.com
  SMTP_PASSWORD  -> senha de app (16 caracteres)
  # Resend (alternativa)
  EMAIL_API_KEY  -> API key do Resend
  # Comum
  EMAIL_FROM     -> remetente exibido; se ausente, usa SMTP_USER
                    aceita "Nome <email@dominio>" ou só "email@dominio"
"""
import asyncio
import logging
import os
import smtplib
import socket
from email.message import EmailMessage
from email.utils import parseaddr

import httpx

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()

EMAIL_API_KEY = os.getenv("EMAIL_API_KEY", "").strip()
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "").strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", "").strip() or SMTP_USER or "onboarding@resend.dev"

# "MeuTerritório <email@dominio>" -> ("MeuTerritório", "email@dominio")
_FROM_NAME, _FROM_EMAIL = parseaddr(EMAIL_FROM)
_FROM_EMAIL = _FROM_EMAIL or SMTP_USER


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


async def _send_via_brevo(to: str, subject: str, html: str) -> bool:
    """Envio pela API HTTP do Brevo (porta 443 — funciona no Render free)."""
    sender = {"email": _FROM_EMAIL}
    if _FROM_NAME:
        sender["name"] = _FROM_NAME
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                BREVO_API_URL,
                headers={
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json={
                    "sender": sender,
                    "to": [{"email": to}],
                    "subject": subject,
                    "htmlContent": html,
                },
            )
        if resp.status_code >= 400:
            logger.error("Falha ao enviar e-mail via Brevo (%s): %s", resp.status_code, resp.text)
            return False
        logger.info("E-mail (Brevo) enviado para %s (assunto: %s)", to, subject)
        return True
    except Exception as exc:
        logger.error("Erro ao enviar e-mail via Brevo para %s: %s", to, exc)
        return False


async def _send_email(to: str, subject: str, html: str) -> bool:
    """Envia um e-mail pelo transporte configurado. True se enviado, False caso contrário."""
    # 1. Brevo (API HTTP) — preferido em produção (não usa portas SMTP)
    if BREVO_API_KEY:
        return await _send_via_brevo(to, subject, html)

    # 2. SMTP (Gmail e afins)
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            await asyncio.to_thread(_send_via_smtp_sync, to, subject, html)
            logger.info("E-mail (SMTP) enviado para %s (assunto: %s)", to, subject)
            return True
        except Exception as exc:
            logger.error("Erro ao enviar e-mail via SMTP para %s: %s", to, exc)
            return False

    # 3. Resend (API HTTP)
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

    # 4. Fallback: sem transporte configurado — apenas loga
    logger.warning(
        "Nenhum transporte de e-mail configurado (SMTP_* ou EMAIL_API_KEY) — "
        "e-mail NÃO enviado. Destinatário: %s | Assunto: %s\nConteúdo:\n%s",
        to, subject, html,
    )
    return False


async def send_password_reset_email(to: str, reset_link: str) -> bool:
    """Envia o e-mail de recuperação de senha com o link de redefinição."""
    subject = "Recuperação de senha — MeuTerritório"
    expira_min = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "30"))
    html = f"""\
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>Recuperação de senha</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9;">
  <!-- pré-cabeçalho oculto (texto de prévia na caixa de entrada) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    Redefina a senha da sua conta no MeuTerritório. O link expira em {expira_min} minutos.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#f1f5f9; padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:520px; width:100%; background-color:#ffffff; border-radius:16px;
                      overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.08);
                      font-family:'Segoe UI', Roboto, Arial, sans-serif;">

          <!-- Cabeçalho com faixa da marca -->
          <tr>
            <td style="background:linear-gradient(135deg,#0891b2 0%,#0e7490 100%);
                       padding:32px 40px; text-align:center;">
              <div style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.3px;">
                MeuTerritório
              </div>
              <div style="color:#cffafe; font-size:13px; margin-top:4px;">
                Recuperação de senha
              </div>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:40px 40px 24px 40px; color:#1f2937;">
              <h1 style="margin:0 0 16px 0; font-size:20px; color:#0f172a;">Vamos redefinir sua senha</h1>
              <p style="margin:0 0 14px 0; font-size:15px; line-height:1.6; color:#475569;">
                Recebemos um pedido para redefinir a senha da sua conta no
                <strong style="color:#0f172a;">MeuTerritório</strong>.
              </p>
              <p style="margin:0 0 28px 0; font-size:15px; line-height:1.6; color:#475569;">
                Clique no botão abaixo para criar uma nova senha. Por segurança, este
                link expira em <strong>{expira_min} minutos</strong>.
              </p>

              <!-- Botão à prova de clientes de e-mail -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px auto;">
                <tr>
                  <td align="center" bgcolor="#0891b2" style="border-radius:10px;">
                    <a href="{reset_link}"
                       style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:700;
                              color:#ffffff; text-decoration:none; border-radius:10px;
                              background:linear-gradient(135deg,#0891b2 0%,#0e7490 100%);">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0; font-size:13px; line-height:1.5; color:#94a3b8;">
                Se o botão não funcionar, copie e cole este endereço no navegador:
              </p>
              <p style="margin:0; font-size:13px; line-height:1.5; word-break:break-all;">
                <a href="{reset_link}" style="color:#0891b2; text-decoration:underline;">{reset_link}</a>
              </p>
            </td>
          </tr>

          <!-- Aviso de segurança -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <div style="border-top:1px solid #e2e8f0; padding-top:20px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#94a3b8;">
                  Se você não solicitou esta redefinição, ignore este e-mail com segurança —
                  sua senha continuará a mesma.
                </p>
              </div>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 40px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#cbd5e1;">
                © MeuTerritório · Este é um e-mail automático, não responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return await _send_email(to, subject, html)
