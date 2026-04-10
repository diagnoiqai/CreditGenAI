import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

export const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export const initTwilio = () => {
  if (twilioClient) {
    console.log('SUCCESS: Twilio client initialized for WhatsApp notifications.');
    const whatsappNum = process.env.TWILIO_WHATSAPP_NUMBER;
    if (whatsappNum) {
      console.log(`INFO: WhatsApp sender number configured: ${whatsappNum.substring(0, 12)}...`);
    } else {
      console.warn('WARNING: TWILIO_WHATSAPP_NUMBER is missing. Notifications will fail.');
    }
  } else {
    console.warn('WARNING: Twilio credentials missing. WhatsApp notifications will not work.');
  }
};

export const sendWhatsAppMessage = async (to: string, body: string) => {
  if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER) {
    try {
      let formattedMobile = to.trim().replace(/\s+/g, '');
      if (formattedMobile.length === 10 && !formattedMobile.startsWith('+')) {
        formattedMobile = '+91' + formattedMobile;
      } else if (!formattedMobile.startsWith('+')) {
        formattedMobile = '+' + formattedMobile;
      }

      let fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
      if (!fromNumber.startsWith('whatsapp:')) {
        fromNumber = `whatsapp:${fromNumber}`;
      }

      const result = await twilioClient.messages.create({
        from: fromNumber,
        to: `whatsapp:${formattedMobile}`,
        body: body
      });
      console.log(`SUCCESS: WHATSAPP SENT. SID: ${result.sid}`);
      return result;
    } catch (error) {
      console.error("FAILED TO SEND WHATSAPP:", error);
      throw error;
    }
  } else {
    console.warn('WARNING: Twilio not configured. WhatsApp message skipped.');
    return null;
  }
};
