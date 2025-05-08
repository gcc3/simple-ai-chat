import React, { useState } from "react";


function PreviewImage({ image } = {}) {
  const [loaded, setLoaded] = useState(false);

  if (!image) return null;

  return (
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      onLoad={() => setLoaded(true)}
      style={{
        width: loaded ? "100%" : "0px",
        height: loaded ? "100%" : "0px",
        transition: "width 0.05s, height 0.05s"
      }}
    />
  );
}

export default PreviewImage;