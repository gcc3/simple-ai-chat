import { getUser, updateUserBalance } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }
  const { id, username } = authResult.user;
  
  // Get latest user info
  const user = await getUser(username);
  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'User not found.'
    });
  }

  // Input and validation
  const { amount: amount_, details } = req.body;
  const amount = parseFloat(amount_);

  if (!amount || amount < 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }
  if (!details) {
    return res.status(400).json({ error: 'Invalid details.' });
  }

  // Confrim if amount is received
  if (!await confrimReceived(amount, JSON.parse(details))) {
    return res.status(400).json({ error: 'Failed to confirm payment.' });
  }

  try {
    // Charge calc
    const oldBalanceCents = user.balance * 100;   // Convert dollars to cents
    const changeCents = amount * 100;             // Convert dollars to cents
    const newBalanceCents = oldBalanceCents + changeCents;
    const newBalanceDollars = (newBalanceCents / 100).toFixed(2);

    // Update user balance
    const wasSuccessful = await updateUserBalance(username, newBalanceDollars);
    if (wasSuccessful) {
      // Print log
      console.log(`User \`${username}\` charged balance by $${amount}, old balance: $${user.balance}, new balance: $${newBalanceDollars}.`);
      console.log('payment details:', details);

      // TODO, send email to user
      return res.status(200).json({
        success: true,
        message: "Balance updated."
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Failed to update balance.'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error occurred while updating the balance.'
    });
  }
}

async function confrimReceived(amount, details) {
  const transactionId = details.id;
  const status = details.status;
  if (status !== 'COMPLETED') {
    return false;
  }
  
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const accessToken = await getPayPalAccessToken(clientId, secret);
  if (!accessToken) {
    return false;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction ? 'https://api.paypal.com' : 'https://api-m.sandbox.paypal.com';

  try {
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!orderResponse.ok) {
      throw new Error(`PayPal order server responded with status: ${orderResponse.status}, body: ${order}`);
    }
    
    // Verification
    const order = await orderResponse.json();
    if (!order) {
      return false;
    }
    if (!order.id || order.id !== transactionId) {
      return false;
    }
    if (!order.purchase_units || order.purchase_units.length === 0) {
      return false;
    }
    if (!order.status || order.status !== 'COMPLETED') {
      return false;
    }
    if (!order.purchase_units[0].amount || order.purchase_units[0].amount.currency_code !== 'USD') {
      return false;
    }
    if (!order.purchase_units[0].amount.value || parseFloat(order.purchase_units[0].amount.value) - amount > 0.01) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function getPayPalAccessToken(clientId, secret) {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction ? 'https://api.paypal.com' : 'https://api-m.sandbox.paypal.com';

  try {
    // Base64 encode the client ID and secret
    const basicAuth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    // Check the response status
    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      throw new Error(`PayPal token server responded with status: ${tokenResponse.status}, body: ${errorBody}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error obtaining access token:', error);
    return null;
  }
}
