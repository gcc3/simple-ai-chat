import React, { useEffect, useState } from "react";

const PayPalButton = ({ amount, targetRole = null, onSuccess }) => {
  useEffect(() => {
    // Set amount
    if (targetRole) {
      if (targetRole === "pro_user") amount = "5.00";
      if (targetRole === "super_user") amount = "15.00";
    }

    let scriptAdded = false;
    const loadPayPalScript = async () => {
      try {
        const response = await fetch("/api/payment/info");
        const { client_id } = await response.json();

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${client_id}&currency=USD`;
        script.addEventListener("load", setupPayPalButton);
        document.body.appendChild(script);
        scriptAdded = true;
      } catch (error) {
        console.error("PayPal script loading failed:", error);
      }
    };

    const setupPayPalButton = () => {
      if (window.paypal) {
        window.paypal
          .Buttons({
            style: {
              layout: "vertical",
              size: "responsive",
              shape: "pill",
              color: "blue",
            },
            createOrder: (data, actions, error) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: "USD",
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
              console.error("PayPal Checkout onError", err);
            },
          })
          .render("#paypal-button-container");
      }
    };

    loadPayPalScript();
    return () => {
      if (scriptAdded) {
        const script = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
        if (script) {
          script.removeEventListener("load", setupPayPalButton);
          document.body.removeChild(script);
        }
      }
      if (window.paypal && window.paypal.Buttons().isEligible()) {
        window.paypal.Buttons().close();
      }
    };
  }, [onSuccess]);

  return (
    <div className="w-full p-3 m-auto bg-gray-100 rounded-sm">
      <div className="mt-4 max-w-md m-auto" id="paypal-button-container"></div>
    </div>
  );
};

export default PayPalButton;
