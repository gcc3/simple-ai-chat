import React, { useEffect, useState } from 'react';

const PayPalButton = ({ onSuccess }) => {
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    let scriptAdded = false;
    const loadPayPalScript = async () => {
      try {
        const response = await fetch('/api/payment/info');
        const { client_id, amount, currency } = await response.json();
        setAmount(amount);
        setCurrency(currency);

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${client_id}&currency=${currency}`;
        script.addEventListener('load', setupPayPalButton);
        document.body.appendChild(script);
        scriptAdded = true;
      } catch (error) {
        console.error('PayPal script loading failed:', error);
      }
    };

    const setupPayPalButton = () => {
      if (window.paypal) {
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            size: 'responsive',
            shape: 'pill',
            color: 'blue',
          },
          createOrder: (data, actions, error) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    currency_code: currency,
                    value: amount,
                  },
                },
              ],
            });
          },
          onApprove: async (data, actions) => {
            const order = await actions.order.capture();
            onSuccess(order); // passed as a prop
          },
          onError: (err) => {
            console.error('PayPal Checkout onError', err);
          },
        }).render('#paypal-button-container');
      }
    };

    loadPayPalScript();

    return () => {
      if (scriptAdded) {
        const script = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
        if (script) {
          script.removeEventListener('load', setupPayPalButton);
          document.body.removeChild(script);
        }
      }
      if (window.paypal && window.paypal.Buttons().isEligible()) {
        window.paypal.Buttons().close();
      }
    };
  }, [amount, currency, onSuccess]);

  return <div id="paypal-button-container"></div>;
};

export default PayPalButton;