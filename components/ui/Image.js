import React, { useState } from "react";


function Image({ image }) {
  const [loaded, setLoaded] = useState(false);

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

export default Image;