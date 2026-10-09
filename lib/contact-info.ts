export const WHATSAPP_NUMBER = '919760926681';

function normaliseWhatsAppNumber(number?: string) {
  const cleaned = (number || '').replace(/\D/g, '');
  if (!cleaned) return WHATSAPP_NUMBER;
  return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
}

export function getWhatsAppUrl(message: string, number?: string): string {
  return `https://wa.me/${normaliseWhatsAppNumber(number)}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppUrlForNumber(number: string, message: string): string {
  return getWhatsAppUrl(message, number);
}