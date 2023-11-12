import AWS from 'aws-sdk';

export default async function (req, res) {
  // Check if the method is GET.
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    // Set params for S3.getSignedUrl()
    const params = {
      Bucket: 'simpleaibucket',
      Key: req.query.fileId,
      Expires: 60,
      ContentType: req.query.contentType,
    };

    // Initialize AWS
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: 'us-east-1'
    });

    // Create S3 service object
    const s3 = new AWS.S3();

    // Get signed URL
    s3.getSignedUrl('putObject', params, (err, url) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: "Error creating pre-signed URL" });
      } else {
        res.status(200).json({ url });
      }
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
