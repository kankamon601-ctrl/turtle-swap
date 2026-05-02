import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from flask import current_app


def send_match_email(match):
    """Send notification emails to both users when a match is created."""
    config = current_app.config

    # Skip if email is not configured
    if not config.get("MAIL_USERNAME") or not config.get("MAIL_PASSWORD"):
        print("Email not configured - skipping notification")
        return

    user_a = match.user_a  # the lister who accepted
    user_b = match.user_b  # the offerer
    offer = match.offer
    offer_message = offer.message or ""

    # Email to User A (lister who accepted) — always send match emails
    # even if notifications are off, since this is a critical transactional email
    _send_email(
        to_email=user_a.email,
        to_name=user_a.username,
        subject=f"SwapHoot: You matched with {user_b.username}! 🦉",
        body=_build_email_body(
            recipient_name=user_a.username,
            partner_name=user_b.username,
            partner_email=user_b.email,
            partner_whatsapp=user_b.whatsapp,
            your_item=offer.target_item.title,
            their_item=offer.offered_item.title,
            offer_message=offer_message,
            is_accepter=True,
        ),
        config=config,
    )

    # Email to User B (offerer whose offer was accepted)
    _send_email(
        to_email=user_b.email,
        to_name=user_b.username,
        subject=f"SwapHoot: {user_a.username} accepted your offer! 🎉",
        body=_build_email_body(
            recipient_name=user_b.username,
            partner_name=user_a.username,
            partner_email=user_a.email,
            partner_whatsapp=user_a.whatsapp,
            your_item=offer.offered_item.title,
            their_item=offer.target_item.title,
            offer_message=offer_message,
            is_accepter=False,
        ),
        config=config,
    )


def _build_email_body(
    recipient_name, partner_name, partner_email, partner_whatsapp,
    your_item, their_item, offer_message="", is_accepter=True
):
    """Build the match notification email content."""
    # WhatsApp contact block (only if partner has one)
    whatsapp_html = ""
    if partner_whatsapp:
        wa_number = partner_whatsapp.replace("+", "").replace(" ", "").replace("-", "")
        whatsapp_html = f"""
            <p>
                <a href="https://wa.me/{wa_number}"
                   style="display:inline-block; background:#25D366; color:#fff;
                          padding:10px 20px; border-radius:8px; text-decoration:none;
                          font-weight:bold;">
                    💬 Chat on WhatsApp
                </a>
            </p>
        """

    # Offer message block (only if there was a message)
    message_html = ""
    if offer_message.strip():
        if is_accepter:
            label = f"💬 Message from {partner_name}"
        else:
            label = "💬 Your message"
        message_html = f"""
            <div style="background: #FFF8E1; padding: 12px 16px; border-radius: 8px;
                        margin: 16px 0; border-left: 4px solid #FFB300;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #888; font-weight: 600;">
                    {label}
                </p>
                <p style="margin: 0; font-style: italic; color: #555;">
                    "{offer_message}"
                </p>
            </div>
        """

    return f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align:center; margin-bottom: 24px;">
            <h1 style="color: #2D6A4F; margin: 0;">🦉 SwapHoot</h1>
        </div>

        <div style="background: #F0FFF4; border: 1px solid #B7E4C7; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #1B4332; margin-top: 0;">It's a match! 🎉</h2>
            <p>Hi <strong>{recipient_name}</strong>,</p>
            <p>Great news — a swap has been agreed!</p>

            <div style="background: #fff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #40916C;">
                <p style="margin: 4px 0;"><strong>Your item:</strong> {your_item}</p>
                <p style="margin: 4px 0;"><strong>Their item:</strong> {their_item}</p>
            </div>

            {message_html}

            <h3 style="color: #2D6A4F; margin-bottom: 8px;">Contact {partner_name}</h3>
            <p>
                📧 <a href="mailto:{partner_email}" style="color: #2D6A4F;">{partner_email}</a>
            </p>
            {whatsapp_html}
        </div>

        <p style="text-align:center; color: #888; font-size: 12px; margin-top: 32px;">
            Swap, don't shop 🌱 — SwapHoot
        </p>
    </body>
    </html>
    """


def send_offer_email(target_user, offerer, target_item, offered_item, message):
    """
    Send a single "you have new offers" email.  Only called when
    target_user.offer_notified_pending is False (first unread offer).
    """
    config = current_app.config

    if not config.get("MAIL_USERNAME") or not config.get("MAIL_PASSWORD"):
        return

    # Offer message block
    message_html = ""
    if message and message.strip():
        message_html = f"""
            <div style="background: #FFF8E1; padding: 12px 16px; border-radius: 8px;
                        margin: 16px 0; border-left: 4px solid #FFB300;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #888; font-weight: 600;">
                    💬 Message from {offerer.username}
                </p>
                <p style="margin: 0; font-style: italic; color: #555;">
                    "{message}"
                </p>
            </div>
        """

    body = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align:center; margin-bottom: 24px;">
            <h1 style="color: #2D6A4F; margin: 0;">🦉 SwapHoot</h1>
        </div>

        <div style="background: #F0FFF4; border: 1px solid #B7E4C7; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #1B4332; margin-top: 0;">You have a new swap offer! 🔔</h2>
            <p>Hi <strong>{target_user.username}</strong>,</p>
            <p><strong>{offerer.username}</strong> wants to swap with you:</p>

            <div style="background: #fff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #40916C;">
                <p style="margin: 4px 0;"><strong>They want:</strong> {target_item.title}</p>
                <p style="margin: 4px 0;"><strong>They offer:</strong> {offered_item.title}</p>
            </div>

            {message_html}

            <p>
                <a href="#" style="display:inline-block; background:#2D6A4F; color:#fff;
                   padding:12px 24px; border-radius:8px; text-decoration:none;
                   font-weight:bold;">
                    🦉 Review your offers
                </a>
            </p>
            <p style="font-size: 12px; color: #888;">
                Log in to SwapHoot to accept, hold, or pass on this offer.
            </p>
        </div>

        <p style="text-align:center; color: #888; font-size: 12px; margin-top: 32px;">
            Swap, don't shop 🌱 — SwapHoot
        </p>
    </body>
    </html>
    """

    _send_email(
        to_email=target_user.email,
        to_name=target_user.username,
        subject=f"SwapHoot: {offerer.username} wants to swap with you! 🦉",
        body=body,
        config=config,
    )
    print(f"Offer notification email sent to {target_user.email}")


def send_password_reset_email(user, reset_url):
    """
    Send a password-reset link to the user. Called by the /forgot-password
    endpoint. Always-on (ignores email_notifications) since this is a
    transactional security email.
    """
    config = current_app.config

    if not config.get("MAIL_USERNAME") or not config.get("MAIL_PASSWORD"):
        print("Email not configured - skipping password reset email")
        return

    body = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align:center; margin-bottom: 24px;">
            <h1 style="color: #2D6A4F; margin: 0;">🦉 SwapHoot</h1>
        </div>

        <div style="background: #F0FFF4; border: 1px solid #B7E4C7; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #1B4332; margin-top: 0;">Reset your password</h2>
            <p>Hi <strong>{user.username}</strong>,</p>
            <p>Someone (hopefully you) asked to reset the password on your SwapHoot account. Click the button below to pick a new one:</p>

            <p style="text-align:center; margin: 24px 0;">
                <a href="{reset_url}"
                   style="display:inline-block; background:#2D6A4F; color:#fff;
                          padding:12px 28px; border-radius:8px; text-decoration:none;
                          font-weight:bold;">
                    Reset password
                </a>
            </p>

            <p style="font-size: 13px; color: #555;">
                Or copy this link into your browser:<br>
                <a href="{reset_url}" style="color:#2D6A4F; word-break: break-all;">{reset_url}</a>
            </p>

            <p style="font-size: 12px; color: #888; margin-top: 20px;">
                This link expires in <strong>1 hour</strong>. If you didn't ask for a reset, you can safely ignore this email — your password won't change.
            </p>
        </div>

        <p style="text-align:center; color: #888; font-size: 12px; margin-top: 32px;">
            Swap, don't shop 🌱 — SwapHoot
        </p>
    </body>
    </html>
    """

    _send_email(
        to_email=user.email,
        to_name=user.username,
        subject="SwapHoot: reset your password 🦉",
        body=body,
        config=config,
    )
    print(f"Password reset email sent to {user.email}")


def _send_email(to_email, to_name, subject, body, config):
    """Send an HTML email via SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"SwapHoot <{config['MAIL_USERNAME']}>"
    msg["To"] = f"{to_name} <{to_email}>"
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(config["MAIL_SERVER"], config["MAIL_PORT"]) as server:
        server.starttls()
        server.login(config["MAIL_USERNAME"], config["MAIL_PASSWORD"])
        server.send_message(msg)

    print(f"Match email sent to {to_email}")
