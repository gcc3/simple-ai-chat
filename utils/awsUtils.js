export async function generateFileURl(blob, file_id) {
  // Image type
  let contentType = "";
  if (blob.name.endsWith('.jpeg') || blob.name.endsWith('.jpg')) {
    contentType = 'image/jpeg';
  } else if (blob.name.endsWith('.png')) {
    contentType = 'image/png';
  } else {
    return {
      success: false,
      message: 'Invalid image type. Only JPEG and PNG are supported.'
    };
  }

  // Upload the image
  console.log('Getting pre-signed URL...');
  const response = await fetch("/api/file/generate-presigned-url?fileId=" + file_id + "&fileName=" + blob.name + "&contentType=" + contentType.replaceAll("/", "%2F"), {
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
    console.log('Uploading image...');
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
      console.error('Upload failed:', await uploadResult.text());
      return {
        success: false,
        message: 'Upload failed'
      };
    }
  } else {
    console.error('Pre-signed URL invalid.');
    return {
      success: false,
      message: 'Pre-signed URL invalid.'
    };
  }
}
