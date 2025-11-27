import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaShareAlt, FaFacebook, FaTwitter, FaLink, FaArrowLeft } from 'react-icons/fa';
import { events } from '../data/events';
import TournamentBracket from '../components/TournamentBracket';
import { Helmet } from 'react-helmet-async';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    const foundEvent = events.find(e => e.id === parseInt(id));
    setEvent(foundEvent);
  }, [id]);

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 text-lg">Event not found</p>
        <Link to="/events" className="text-blue-500 hover:underline mt-4 inline-block">
          Back to Events
        </Link>
      </div>
    );
  }

  const handleShare = (platform) => {
    const url = window.location.href;
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
        alert('Link copied to clipboard!');
        break;
      default:
        break;
    }
    setShowShareOptions(false);
  };

  const navigate = useNavigate();

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-8">The event you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{event.title} | PickleBall Courts</title>
        <meta name="description" content={event.description.substring(0, 160)} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative bg-gray-900">
          <div className="absolute inset-0 overflow-hidden">
            <img
              className="w-full h-full object-cover opacity-50"
              src={event.banner}
              alt={event.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {event.title}
              </h1>
              <div className="mt-6 max-w-3xl mx-auto">
                <div className="inline-flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-lg text-blue-100">
                  <div className="flex items-center">
                    <FaCalendarAlt className="flex-shrink-0 mr-2" />
                    <span>
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                      {event.time && ` • ${event.time}`}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="flex-shrink-0 mr-2" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Event Details</h2>
              <div className="relative">
                <button
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaShareAlt className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
                  Share
                </button>

                {showShareOptions && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleShare('facebook')}
                        className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <FaFacebook className="inline-block mr-2 text-blue-600" />
                        Share on Facebook
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <FaTwitter className="inline-block mr-2 text-blue-400" />
                        Share on Twitter
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <FaLink className="inline-block mr-2" />
                        Copy link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700">{event.description}</p>
              </div>
              
              <div className="mt-12">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tournament Bracket</h3>
                <TournamentBracket tournaments={event.tournaments} />
              </div>
              
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={() => window.history.back()}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Events
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetail;
