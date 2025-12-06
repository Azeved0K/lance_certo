from django.core.mail import EmailMultiAlternatives
from django.conf import settings


def send_password_reset_email(email, code, username=None):
    """
    Envia um email de recuperação de senha com o código fornecido.
    """
    subject = 'Recuperação de senha - Lance Certo'
    from_email = getattr(settings, 'MY_EMAIL', None) or getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@lancecerto.com')
    text_content = f"Olá{(' ' + username) if username else ''},\n\nSeu código de recuperação é: { code }\n\nSe você não solicitou essa ação, ignore este email.\n\nAtenciosamente,\nEquipe Lance Certo"

    html_content = f"""
    <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #222;">
            <div style="max-width:600px;margin:0 auto;padding:16px;">
                <h2 style="color:#111;margin-bottom:8px;">Recuperação de senha - Lance Certo</h2>
                <p>Olá{(' ' + username) if username else ''},</p>
                <p>Seu código de recuperação é:</p>
                <p style="font-size:20px;font-weight:700;letter-spacing:2px;background:#f5f5f5;padding:12px;border-radius:6px;display:inline-block;">{code}</p>
                <p style="margin-top:16px;color:#666;">Se você não solicitou essa ação, ignore este email.</p>
                <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
                <small style="color:#999;">Este é um email automático — por favor, não responda.</small>
            </div>
        </body>
    </html>
    """

    msg = EmailMultiAlternatives(subject, text_content, from_email, [email])
    msg.attach_alternative(html_content, "text/html")
    # Dispara o envio, se houver qualquer erro, será lançado e o chamador pode tratá-lo
    msg.send(fail_silently=False)
    return True