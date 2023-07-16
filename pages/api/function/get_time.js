export default async function (req, res) {
  try {
    res.status(200).json({
      result: {
        time : await getTime()
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: {
        message : error
      },
    });
  }
}

export async function getTime() {
  return new Date().toLocaleString();
}
