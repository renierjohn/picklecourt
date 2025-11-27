import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaShareAlt, FaFacebook, FaTwitter, FaLink } from 'react-icons/fa';

const EventCard = ({ event }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleShare = (platform) => {
    const url = `${window.location.origin}/events/${event.id}`;
    const text = `Check out this event: ${event.title}`;
    
    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        // You might want to show a toast notification here
        break;
      default:
        break;
    }
    setShowShareOptions(false);
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-100">
      <div className="relative overflow-hidden h-48">
        <img 
          src={event.banner} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {event.tournaments?.length || 0} Matches
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">{event.title}</h3>
          <div className="relative">
            <button 
              onClick={() => setShowShareOptions(!showShareOptions)}
              className="text-gray-400 hover:text-blue-500 transition-colors p-1"
              aria-label="Share event"
            >
              <FaShareAlt size={18} />
            </button>
            
            {showShareOptions && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <button 
                  onClick={() => handleShare('facebook')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FaFacebook className="mr-2 text-blue-600" /> Facebook
                </button>
                <button 
                  onClick={() => handleShare('twitter')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FaTwitter className="mr-2 text-blue-400" /> Twitter
                </button>
                <button 
                  onClick={() => handleShare('copy')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FaLink className="mr-2" /> Copy link
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <FaCalendarAlt className="mr-2 text-blue-500 flex-shrink-0" />
            <span className="text-sm">
              {new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
              {event.time && ` • ${event.time}`}
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <FaMapMarkerAlt className="mr-2 text-blue-500 flex-shrink-0" />
            <span className="text-sm">{event.location}</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-5 line-clamp-2">{event.description}</p>
        
        <Link 
          to={`/events/${event.id}`}
          className="inline-flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          View Details
          <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default EventCard;
