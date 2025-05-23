import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


export async function generateFileUrl(blob, fileId) {
  // Image type
  let contentType = "";
  if (blob.name.endsWith('.jpeg') || blob.name.endsWith('.jpg')) {
    contentType = 'image/jpeg';
  } else if (blob.name.toLowerCase().endsWith('.png')) {
    contentType = 'image/png';
  } else if (blob.name.toLowerCase().endsWith('.docx')) {
    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (blob.name.toLowerCase().endsWith('.txt')) {
    contentType = 'text/plain';
  } else if (blob.name.toLowerCase().endsWith('.md')) {
    contentType = 'text/markdown';
  } else if (blob.name.toLowerCase().endsWith('.csv')) {
    contentType = 'text/csv';
  } else if (blob.name.toLowerCase().endsWith('.pdf')) {
    contentType = 'application/pdf';
  } else if (blob.name.toLowerCase().endsWith('.json')) {
    contentType = 'application/json';
  } else {
    return {
      success: false,
      error: 'Invalid file type. Supported type: JPEG/JPG, PNG, PDF, DOCX, TXT, Markdown, CSV, JSON.'
    };
  }

  // Upload the image/file to S3
  console.log('Getting pre-signed URL...');
  const response = await fetch("/api/file/generate-presigned-url?fileId=" + fileId + "&fileName=" + blob.name + "&contentType=" + contentType.replaceAll("/", "%2F"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  const presignedUrl = data.url;
  const objectUrl = data.object_url;
  console.log('Pre-signed URL: ' + presignedUrl);
  console.log('Object URL: ' + objectUrl);

  // Upload the file directly to S3 using the pre-signed URL
  if (presignedUrl) {
    console.log('Uploading image/file...');
    const uploadResult = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });

    if (uploadResult.ok) {
      console.log('File successfully uploaded to S3');
      return {
        success: true,
        message: 'File successfully uploaded to S3',
        objectUrl: objectUrl
      };
    } else {
      console.error('Upload failed: ' + (await uploadResult.text()));
      return {
        success: false,
        error: "Upload failed"
      };
    }
  } else {
    console.error('Pre-signed URL invalid.');
    return {
      success: false,
      error: "Pre-signed URL invalid."
    };
  }
}

// Get presigned URL
export async function getS3PresignedPutUrl({ bucket, key, expires = 60, contentType }) {
  // Initialize AWS SDK client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: decodeURIComponent(contentType),
  });

  // Generate presigned URL using the request presigner
  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: expires });
    return url;
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    throw err;
  }
}
