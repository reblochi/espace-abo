// Google Ads Server-Side Conversion Tracking
// Envoie les conversions offline via l'API Google Ads quand un paiement est confirme

import crypto from 'crypto';

interface ConversionData {
  gclid: string;
  conversionDateTime: Date;
  conversionValue: number; // en euros
  currencyCode?: string;
  orderId?: string; // reference unique pour deduplication
  // Enhanced conversions (optionnel, ameliore le taux de match)
  email?: string;
  phone?: string;
}

const GOOGLE_ADS_CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID || '';
const GOOGLE_ADS_CONVERSION_ACTION_ID = process.env.GOOGLE_ADS_CONVERSION_ACTION_ID || '';
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || '';
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
const GOOGLE_ADS_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
const GOOGLE_ADS_LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '';

function isConfigured(): boolean {
  return !!(
    GOOGLE_ADS_CUSTOMER_ID &&
    GOOGLE_ADS_CONVERSION_ACTION_ID &&
    GOOGLE_ADS_DEVELOPER_TOKEN &&
    GOOGLE_ADS_REFRESH_TOKEN
  );
}

function hashForEnhancedConversions(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

// Formate la date au format requis par Google Ads: "yyyy-mm-dd hh:mm:ss+|-hh:mm"
function formatConversionDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMinutes = pad(absOffset % 60);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${offsetHours}:${offsetMinutes}`;
}

async function getAccessToken(): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: GOOGLE_ADS_CLIENT_ID,
      client_secret: GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google OAuth token refresh failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function sendConversion(conversionData: ConversionData): Promise<void> {
  if (!isConfigured()) {
    console.log('[Google Ads] Non configure, conversion ignoree:', conversionData.orderId);
    return;
  }

  if (!conversionData.gclid) {
    console.log('[Google Ads] Pas de gclid, conversion ignoree:', conversionData.orderId);
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const customerId = GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');

    const conversionAction = `customers/${customerId}/conversionActions/${GOOGLE_ADS_CONVERSION_ACTION_ID}`;

    // Construire la conversion
    const conversion: Record<string, unknown> = {
      conversionAction,
      gclid: conversionData.gclid,
      conversionDateTime: formatConversionDateTime(conversionData.conversionDateTime),
      conversionValue: conversionData.conversionValue,
      currencyCode: conversionData.currencyCode || 'EUR',
    };

    if (conversionData.orderId) {
      conversion.orderId = conversionData.orderId;
    }

    // Enhanced conversions (ameliore le taux de match)
    if (conversionData.email || conversionData.phone) {
      const userIdentifiers: Record<string, string>[] = [];
      if (conversionData.email) {
        userIdentifiers.push({
          hashedEmail: hashForEnhancedConversions(conversionData.email),
        });
      }
      if (conversionData.phone) {
        userIdentifiers.push({
          hashedPhoneNumber: hashForEnhancedConversions(conversionData.phone),
        });
      }
      conversion.userIdentifiers = userIdentifiers;
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
    };

    if (GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
      headers['login-customer-id'] = GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '');
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}:uploadClickConversions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversions: [conversion],
          partialFailure: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Google Ads] Erreur envoi conversion:', error);
      return;
    }

    const result = await response.json();

    if (result.partialFailureError) {
      console.error('[Google Ads] Erreur partielle:', JSON.stringify(result.partialFailureError));
    } else {
      console.log('[Google Ads] Conversion envoyee:', conversionData.orderId);
    }
  } catch (error) {
    // Ne pas bloquer le flux principal en cas d'erreur tracking
    console.error('[Google Ads] Erreur envoi conversion:', error);
  }
}
