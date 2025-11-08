import { useState, useEffect } from 'react';
import { FaNewspaper, FaExternalLinkAlt, FaCalendarAlt } from 'react-icons/fa';
import '../styles/components/pickleball-news.scss';

const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const RSS_FEED_URL = 'https://pickleballmax.com/feed';

const PickleballNews = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(RSS_FEED_URL)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
console.log(xmlDoc);        
        const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 5).map(item => ({
          title: item.querySelector('title')?.textContent || 'No title',
          link: item.querySelector('link')?.textContent || '#',
          pubDate: item.querySelector('pubDate')?.textContent || '',
          description: item.querySelector('description')?.textContent || 'No description available',
        }));
        
        setArticles(items);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="pickleball-news loading">
        <div className="loader">Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pickleball-news error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="pickleball-news">
      <div className="container">
        <h2 className="section-title">
          <FaNewspaper className="icon" />
          Latest Pickleball News
        </h2>
        <div className="news-grid">
          {articles.map((article, index) => (
            <article key={index} className="news-card">
              <div className="news-content">
                <h3 className="news-title">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="news-link"
                  >
                    {article.title}
                    <FaExternalLinkAlt className="external-icon" />
                  </a>
                </h3>
                {article.pubDate && (
                  <div className="news-meta">
                    <FaCalendarAlt className="meta-icon" />
                    <span>{formatDate(article.pubDate)}</span>
                  </div>
                )}
                <div 
                  className="news-description" 
                  dangerouslySetInnerHTML={{ __html: article.description }} 
                />
                <a 
                  href={article.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="read-more"
                >
                  Read More
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PickleballNews;
