import twilio from 'twilio';

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const fromSms = process.env.TWILIO_PHONE_NUMBER;
const fromWa = process.env.TWILIO_WHATSAPP_NUMBER;

const client = sid && token ? twilio(sid, token) : null;

export async function sendSms(to: string, body: string) {
  if (!client || !fromSms) {
    console.log('[SMS DEV MODE]', { to, body });
    return { mocked: true };
  }
  return client.messages.create({ from: fromSms, to, body });
}

export async function sendWhatsApp(to: string, body: string) {
  if (!client || !fromWa) {
    console.log('[WHATSAPP DEV MODE]', { to, body });
    return { mocked: true };
  }
  return client.messages.create({ from: fromWa, to: `whatsapp:${to}`, body });
}
