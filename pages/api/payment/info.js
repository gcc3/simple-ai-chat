export default async function (req, res) {
  try {
    const client_id = process.env.PAYPAL_CLIENT_ID;
    res.status(200).json({
      client_id: client_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
