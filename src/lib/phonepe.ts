// In-memory cache for the PhonePe auth token
let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

function getBaseUrl() {
  // Use process.env directly to read PHONEPE_ENV dynamically
  const environment = process.env.PHONEPE_ENV || "SANDBOX";
  if (environment === "PRODUCTION") {
    // For authorization it uses identity-manager, for others it uses pg
    return {
      auth: "https://api.phonepe.com/apis/identity-manager",
      api: "https://api.phonepe.com/apis/pg"
    };
  }
  return {
    auth: "https://api-preprod.phonepe.com/apis/pg-sandbox",
    api: "https://api-preprod.phonepe.com/apis/pg-sandbox"
  };
}

export async function getAuthToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  // Return cached token if it is still valid (give a 60 second buffer)
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1";

  if (!clientId || !clientSecret) {
    throw new Error("PhonePe credentials are not configured.");
  }

  const urls = getBaseUrl();
  
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("client_version", clientVersion);
  params.append("grant_type", "client_credentials");

  const res = await fetch(`${urls.auth}/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    // Cache must be "no-store" to ensure we actually fetch a fresh token
    cache: "no-store", 
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get PhonePe auth token: ${res.status} ${text}`);
  }

  const data = await res.json();
  
  // Cache the new token
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: data.expires_at, // expires_at is in epoch seconds
  };

  return data.access_token;
}

export async function createPayment({
  orderId,
  amountInPaise,
  redirectUrl,
}: {
  orderId: string;
  amountInPaise: number;
  redirectUrl: string;
}) {
  const token = await getAuthToken();
  const urls = getBaseUrl();

  const payload = {
    merchantOrderId: orderId,
    amount: amountInPaise,
    paymentFlow: {
      type: "PG_CHECKOUT",
      merchantUrls: {
        redirectUrl: redirectUrl,
      },
    },
  };

  const res = await fetch(`${urls.api}/checkout/v2/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `O-Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create PhonePe payment: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}

export async function checkOrderStatus(merchantOrderId: string) {
  const token = await getAuthToken();
  const urls = getBaseUrl();

  const res = await fetch(`${urls.api}/checkout/v2/order/${merchantOrderId}/status`, {
    method: "GET",
    headers: {
      "Authorization": `O-Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to check PhonePe order status: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}
