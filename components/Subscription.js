import PayPalButton from "./PayPalButton";

function Subscription() {
  const content = (
    <div>
      <div>Payment feature is in working progress, please contect support@simple-ai.io, to get a super_user account.</div>
      {/* <div>Subscribe to become a pro/super user.</div>
      <div className="mt-3 max-w-md">
        <PayPalButton onSuccess={(details) => {
          console.log("Transaction completed by " + details.payer.name);
          console.log("Detail: ", details);
        }} />
      </div> */}
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
