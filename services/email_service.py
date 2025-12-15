import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_NAME = os.getenv("FROM_NAME", "Plataforma Digital")


def enviar_confirmacao_cadastro(email: str, nome: str) -> bool:
    """
    Envia email de confirmação após cadastro concluído.
    Retorna True se enviado com sucesso, False caso contrário.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("⚠️  SMTP não configurado. Email não será enviado.")
        return False
    
    try:
        # Criar mensagem
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Bem-vindo(a) à Plataforma Digital!"
        msg["From"] = f"{FROM_NAME} <{SMTP_EMAIL}>"
        msg["To"] = email
        
        # HTML do email
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 28px; font-weight: 600; }}
                .content {{ padding: 40px 30px; }}
                .content h2 {{ color: #333; margin-top: 0; font-size: 22px; }}
                .content p {{ color: #666; line-height: 1.6; margin: 16px 0; }}
                .success-icon {{ font-size: 48px; text-align: center; margin: 20px 0; }}
                .features {{ background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; }}
                .features ul {{ margin: 0; padding-left: 20px; }}
                .features li {{ color: #555; margin: 12px 0; }}
                .footer {{ background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #888; font-size: 13px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Cadastro Concluído!</h1>
                </div>
                <div class="content">
                    <div class="success-icon">✅</div>
                    <h2>Olá, {nome}!</h2>
                    <p>Seu cadastro foi realizado com sucesso na <strong>Plataforma Digital</strong>.</p>
                    <p>Agora você já pode fazer login e aproveitar todos os recursos disponíveis:</p>
                    
                    <div class="features">
                        <ul>
                            <li>📋 Acesso completo à plataforma</li>
                            <li>🔒 Dados protegidos e criptografados</li>
                            <li>📧 Notificações por email</li>
                            <li>💼 Gestão de perfil personalizada</li>
                        </ul>
                    </div>
                    
                    <p>Se você não criou esta conta, por favor ignore este email.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Plataforma Digital. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Anexar HTML
        msg.attach(MIMEText(html, "html"))
        
        # Enviar email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Email de confirmação enviado para {email}")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao enviar email: {str(e)}")
        return False
