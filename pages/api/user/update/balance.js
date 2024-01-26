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
  const { amount, details } = req.body;
  if (!amount || amount < 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }
  if (!details) {
    return res.status(400).json({ error: 'Invalid details.' });
  }

  // Confrim if amount is received
  if (!confrimReceived(amount)) {
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

function confrimReceived(amount) {
  // TODO, use API to confirm amount is received
  return true;
}

function getTransactions(accessToken) {
  fetch('https://api.paypal.com/v1/reporting/transactions?start_date=START_DATE&end_date=END_DATE', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Transaction Data:', data);
    return data;
  })
  .catch(error => console.error('Error:', error));
}
