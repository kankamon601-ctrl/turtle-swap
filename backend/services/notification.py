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

    # Email to User A (lister)
    _send_email(
        to_email=user_a.email,
        to_name=user_a.username,
        subject=f"SwapMart: You matched with {user_b.username}!",
        body=_build_email_body(
            recipient_name=user_a.username,
            partner_name=user_b.username,
            partner_email=user_b.email,
            your_item=offer.target_item.title,
            their_item=offer.offered_item.title,
        ),
        config=config,
    )

    # Email to User B (offerer)
    _send_email(
        to_email=user_b.email,
        to_name=user_b.username,
        subject=f"SwapMart: {user_a.username} accepted your offer!",
        body=_build_email_body(
            recipient_name=user_b.username,
            partner_name=user_a.username,
            partner_email=user_a.email,
            your_item=offer.offered_item.title,
            their_item=offer.target_item.title,
        ),
        config=config,
    )


def _build_email_body(
    recipient_name, partner_name, partner_email, your_item, their_item
):
    """Build the match notification email content."""
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2B5C8A;">It's a match!</h2>
        <p>Hi {recipient_name},</p>
        <p>Great news! A swap has been agreed:</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Your item:</strong> {your_item}</p>
            <p><strong>Their item:</strong> {their_item}</p>
        </div>
        <p>
            Contact <strong>{partner_name}</strong> at
            <a href="mailto:{partner_email}">{partner_email}</a>
            to arrange the swap.
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 32px;">
            This is an automated message from SwapMart.
        </p>
    </body>
    </html>
    """


def _send_email(to_email, to_name, subject, body, config):
    """Send an HTML email via SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"SwapMart <{config['MAIL_USERNAME']}>"
    msg["To"] = f"{to_name} <{to_email}>"
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(config["MAIL_SERVER"], config["MAIL_PORT"]) as server:
        server.starttls()
        server.login(config["MAIL_USERNAME"], config["MAIL_PASSWORD"])
        server.send_message(msg)

    print(f"Match email sent to {to_email}")
