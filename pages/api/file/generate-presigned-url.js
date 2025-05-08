import { getS3PresignedPutUrl } from "utils/awsUtils";


export default async function (req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { fileId, fileName, contentType } = req.query;
  const key = fileId + "_" + fileName;
  const bucket = process.env.AWS_S3_BUCKET_NAME;

  try {
    const url = await getS3PresignedPutUrl({
      bucket,
      key,
      contentType
    });
    res.status(200).json({
      url,
      object_url: `https://${bucket}.s3.amazonaws.com/${key}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating pre-signed URL" });
  }
}
