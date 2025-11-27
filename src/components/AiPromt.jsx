import { useState, useEffect } from 'react';

const Quote = () => {
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_WORKER_URL}/api/llm`);
        if (!response.ok) {
          throw new Error('Failed to fetch quote');
        }
        const data = await response.json();
        setQuote(data.response || 'No data available');
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError('Failed to load quote. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  if (loading) {
    return (
      <div className="quote-container loading">
        <div className="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quote-container error">
        <p>{error}</p>
      </div>
    );
  }

  // Function to render content with proper formatting
  const renderContent = (content) => {
    // Format text enclosed in ** as bold
    const formatBoldText = (text) => {
      return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    // Check if content contains newlines (indicating a list)
    if (content.includes('\n')) {
      const items = content.split('\n').filter(item => item.trim() !== '');
      return (
        <ul className="quote-list">
          {items.map((item, index) => (
            <li 
              key={index} 
              className="quote-list-item"
              dangerouslySetInnerHTML={{ 
                __html: formatBoldText(item.trim().replace(/^[-•*]\s*/, ''))
              }}
            />
          ))}
        </ul>
      );
    }
    
    // For regular text, wrap in blockquote
    return (
      <blockquote 
        className="quote" 
        dangerouslySetInnerHTML={{ 
          __html: `"${formatBoldText(content)}"` 
        }} 
      />
    );
  };

  return (
    <section className="quote-section">
      <div className="container">
        {renderContent(quote)}
      </div>
    </section>
  );
};

export default Quote;
