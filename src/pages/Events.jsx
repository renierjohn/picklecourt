import React from 'react';
import { Link } from 'react-router-dom';

import EventCard from '../components/EventCard';

const Events = () => {
const events = [
  {
    id: 1,
    title: 'Summer Tennis Tournament',
    date: '2025-12-15',
    time: '09:00 AM',
    location: 'Central Tennis Court',
    description: 'Annual summer tennis tournament for all skill levels. Join us for a day of competitive matches and fun activities!',
    banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe19503c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
    tournaments: [
      { id: 't1', player1: 'John Doe', player2: 'Jane Smith', score: '6-4, 7-5' },
      { id: 't2', player1: 'Mike Johnson', player2: 'Sarah Williams', score: '6-2, 6-1' },
      { id: 't3', player1: 'Alex Brown', player2: 'Emily Davis', score: '7-6(5), 6-3' }
    ]
  },
  {
    id: 2,
    title: 'Winter Badminton Championship',
    date: '2025-12-20',
    time: '10:00 AM',
    location: 'Sports Complex Hall A',
    description: 'Winter badminton championship featuring top players from the region. Exciting matches and prizes await!',
    banner: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
    tournaments: [
      { id: 't1', player1: 'Robert Taylor', player2: 'Lisa Wong', score: '21-15, 21-18' },
      { id: 't2', player1: 'David Kim', player2: 'Anna Chen', score: '21-12, 21-14' }
    ]
  }
];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Upcoming Events
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Join our exciting tournaments and events. Something for everyone!
          </p>
        </div>

        <div className="flex justify-end mb-8">
          <Link 
            to="/events/create" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Event
          </Link>
        </div>
        
        {events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No events scheduled</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
            <div className="mt-6">
              <Link
                to="/events/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} className="flex">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
