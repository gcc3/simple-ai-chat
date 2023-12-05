import PayPalButton from "./PayPalButton";

function Subscription() {
  const content = (
    <div>
      <div>Subscribe to become a pro/super user.</div>
      <PayPalButton className="mt-3 max-w-md" onSuccess={(details) => {
        console.log("Transaction completed by " + details.payer.name);
        console.log("Detail: ", details);

        // TODO: Save user subscription
      }} />
    </div>
  )

  return (
    <div className="Subcription">
      <div className="text-center mb-4">
         <div>Subscription</div>
      </div>
      <div>{content}</div>
    </div>
  );
}

export default Subscription;
