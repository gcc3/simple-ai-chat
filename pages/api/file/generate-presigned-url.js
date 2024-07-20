import AWS from 'aws-sdk';

export default async function (req, res) {
  // Check method
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { fileId, fileName, contentType } = req.query;
  const key = fileId + "_" + fileName;
  const bucket = process.env.AWS_S3_BUCKET_NAME;

  try {
    // Set params for S3.getSignedUrl()
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60,
      ContentType: decodeURIComponent(contentType),
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
        res.status(200).json({ 
          url,
          object_url: `https://${bucket}.s3.amazonaws.com/${key}`
        });
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
