import React from 'react';
import { Link } from 'react-router-dom';
import GoogleAdsense from '../components/GoogleAdsense';
import '../styles/pages/pricing.scss';

const Pricing = () => {
  const plans = [
    {
      name: 'FREE',
      price: '0%',
      period: 'per Booking',
      bannerColor: 'bg-green-500',
      features: [
        { name: 'Contact Court Owner', included: true },
        { name: 'Social Media Links', included: true },
        { name: 'Google Map location', included: true },
        { name: 'Reatime Booking', included: false },
        { name: 'Multiple Payment Method', included: false },
        { name: 'Multiple Slots', included: false },
        { name: 'Customized Booking Date & Time', included: false },
        { name: 'Download Report as List of Bookings', included: false },
        { name: 'RealTime Chat System', included: false },
        { name: 'RealTime Booking Notification', included: false },
        { name: 'Remote Support', included: false },
      ],
      button: {
        text: 'SELECT',
        to: '/register?plan=free'
      }
    },
    {
      name: 'BASIC (FREE 6 Months Service)',
      price: '1%',
      period: 'per Booking',
      bannerColor: 'bg-teal-500',
      features: [
        { name: 'Reatime Booking', included: true },
        { name: 'Social Media Links', included: true },
        { name: 'Google Map location', included: true },
        { name: 'Multiple Payment Method', included: true },
        { name: 'Multiple Slots', included: true },
        { name: 'Customized Booking Date & Time', included: true },
        { name: '1 mo. Booking Retention', included: true },
        { name: 'Download Report as List of Bookings', included: false },
        { name: 'RealTime Chat System', included: false },
        { name: 'RealTime Booking Notification', included: false },
        { name: 'Remote Support', included: false },
      ],
      button: {
        text: 'SELECT',
        to: '/register?plan=basic'
      }
    },
    {
      name: 'STANDARD (FREE 1 Month Service)',
      price: '2%',
      period: 'per Booking',
      bannerColor: 'bg-orange-500',
      popular: false,
       features: [
        { name: 'Reatime Booking', included: true },
        { name: 'Social Media Links', included: true },
        { name: 'Google Map location', included: true },
        { name: 'Multiple Payment Method', included: true },
        { name: 'Multiple Slots', included: true },
        { name: 'Customized Booking Date & Time', included: true },
        { name: '3 mo. Booking Retention', included: true },
        { name: 'Download Report as List of Bookings', included: true },
        { name: 'RealTime Chat System', included: true },
        { name: 'RealTime Booking Notification', included: false },
        { name: 'Remote Support', included: false },
      ],
      button: {
        text: 'SELECT',
        to: '/register?plan=standard'
      }
    },
    {
      name: 'PREMIUM',
      price: '5%',
      period: 'per Booking',
      bannerColor: 'bg-pink-500',
       features: [
        { name: 'Reatime Booking', included: true },
        { name: 'Social Media Links', included: true },
        { name: 'Google Map location', included: true },
        { name: 'Multiple Payment Method', included: true },
        { name: 'Multiple Slots', included: true },
        { name: 'Customized Booking Date & Time', included: true },
        { name: '6 mo. Booking Retention', included: true },
        { name: 'Download Report as List of Bookings', included: true },
        { name: 'RealTime Chat System', included: true },
        { name: 'RealTime Booking Notification', included: true },
        { name: 'Remote Support', included: true },
      ],
      button: {
        text: 'SELECT',
        to: '/register?plan=premium'
      }
    }
  ];

  return (
    <div className="pricing-page min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan that fits your needs <br />With 6 months free service as Basic Plan
          </p>
        </div>

        <div className="flex flex-wrap justify-center -mx-4">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`pricing-card ${plan.bannerColor} bg-white rounded-lg shadow-lg overflow-hidden relative mx-4 mb-8 w-full sm:w-5/6 md:w-80 lg:w-72 xl:w-80 ${
                plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
                            
              <div className="p-6">
                <h2 className="text-2xl font-bold text-center mb-2">{plan.name}</h2>
                
                <div className="text-center my-6">
                  <p className="text-4xl font-bold">{plan.price}</p>
                  <p className="text-gray-600 text-sm">{plan.period}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      {feature.included ? (
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={feature.included ? 'text-gray-800' : 'text-gray-400 line-through'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to={plan.button.to}
                  className={`btn btn-primary block w-full text-center py-3 px-4 rounded-md font-medium ${
                    plan.popular 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  } transition-colors`}
                >
                  {plan.button.text}
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="container mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                question: "Do i have to deposit payment ?",
                answer: "No, you can use the app without depositing any payment."
              },
              {
                question: "What happens if i cancel my subscription after 6 months?",
                answer: "After 6 months, Your account is still active but subscription will be downgrade to free plan."
              },
              {
                question: "What is Realtime Chat System?",
                answer: "Realtime Chat System is a feature that allows customers to chat with you in real-time using Tawkto App."
              },
              {
                question: "What is Realtime Booking Notification?",
                answer: "Realtime Booking Notification is a feature that court owners will be notified when a booking is made, booking is approved, or booking is rejected."
              },
              {
                question: "What is Remote Support?",
                answer: "Remote Support is a feature that court owners can get help from our support team."
              },
              {
                question: "Where do i pay my subscription?",
                answer: "As of now, you can pay your subscription through GCash or Bank Transfer."
              }
            ].map((faq, index) => (
              <div key={index} className="mb-4 bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium text-gray-900">{faq.question}</h3>
                <p className="mt-1 text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <GoogleAdsense />
    </div>
  );
};

export default Pricing;
