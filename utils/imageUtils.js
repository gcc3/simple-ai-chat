const fetch = require('node-fetch');
const imageSize = require('image-size');

export async function fetchImageSize(url) {
  try {
    // Fetch the image data
    const response = await fetch(url);
    const buffer = await response.buffer();

    // Get the size of the image
    const dimensions = imageSize(buffer);
    return dimensions;
  } catch (error) {
    console.error("Error fetching image size:", error);
    throw error;
  }
}