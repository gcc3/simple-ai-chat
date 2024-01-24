import React from 'react';
import { Helmet } from 'react-helmet';

const GoogleAdsGtag = () => {
  const googleAdsId = 'AW-11473098392';

  return (
    <Helmet>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAdsId}');
        `}
      </script>
    </Helmet>
  );
};

export default GoogleAdsGtag;