import AWS from 'aws-sdk';

// Initialize AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});

// Create S3 service object
const s3 = new AWS.S3();

// Upload file to S3
// Also set permission to public-read
export const uploadFile = async (file, fileName) => {
  const params = {
    Bucket: 'simpleaibucket',
    Key: fileName,
    Body: file,
    ACL: 'public-read'
  };
  const result = await s3.upload(params).promise();
  return result;
}

// Delete file from S3
export const deleteFile = async (fileName) => {
  const params = {
    Bucket: 'simpleaibucket',
    Key: fileName
  };
  const result = await s3.deleteObject(params).promise();
  return result;
}

// Get file from S3
export const getFile = async (fileName) => {
  const params = {
    Bucket: 'simpleaibucket',
    Key: fileName
  };
  const result = await s3.getObject(params).promise();
  return result;
}
