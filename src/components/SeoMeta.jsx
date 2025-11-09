import { Helmet } from 'react-helmet-async';

const SeoMeta = ({ title, description, image, url }) => {
  const defaultTitle = "PickleBall Courts - Book Your Game";
  const defaultDescription = "Book your PickleBall court online. Easy, fast, and secure court reservations for PickleBall enthusiasts.";
  const defaultImage = "https://events-ph.com/images/social-preview.jpg";
  const siteUrl = "https://events-ph.com";

  return (
    <Helmet>
      <title>{title || defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url || siteUrl} />
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url || siteUrl} />
      <meta property="twitter:title" content={title || defaultTitle} />
      <meta property="twitter:description" content={description || defaultDescription} />
      <meta property="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};

export default SeoMeta;
