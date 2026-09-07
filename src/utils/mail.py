from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel
from typing import List


conf = ConnectionConfig(
    MAIL_USERNAME = "vishalgoswami7043@gmail.com",
    MAIL_PASSWORD = "nflq tvvq ihnn kxmz",
    MAIL_FROM = "vishalgoswami7043@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_FROM_NAME="Tech LearningPlatform",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)


async def send_email(emails:List[str]):
    html = """<p>Hi, Thanks for Register. Our team will connect you soon.</p> """

    message = MessageSchema(
        subject="Registration Confirmation Mail",
        recipients=emails,
        body=html,
        subtype=MessageType.html)

    fm = FastMail(conf)
    await fm.send_message(message)
    print({"message":"Mail has been send"})