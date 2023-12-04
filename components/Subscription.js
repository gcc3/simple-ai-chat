import PayPalButton from "./PayPalButton";

function Subscription() {
  const content = (
    <div>
      <div>Subscribe to become a pro/super user, $5/momth.</div>
      <div className="mt-3 max-w-md">
        <PayPalButton amount={10} onSuccess={(details) => {
          console.log("Transaction completed by " + details.payer.name);
          console.log(details);
        }} />
      </div>
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
