import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

// Demo Chat Widget Component
const DemoChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Merhaba! Ben demo chatbot\'unuz. Size nasıl yardımcı olabilirim?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const maxMessages = 5;

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || messageCount >= maxMessages) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessageCount(prev => prev + 1);
    
    // Kullanıcı mesajını ekle
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/webhook/demo-chat`,
        { message: userMessage },
        { headers: { 'Content-Type': 'application/json' } }
      );

      // Bot cevabını ekle
      setMessages(prev => [...prev, { type: 'bot', text: response.data.reply }]);
    } catch (error) {
      console.error('Demo chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Üzgünüm, şu anda cevap veremiyorum. Lütfen daha sonra tekrar deneyin.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-semibold">Demo Chatbot</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Limit Warning */}
            {messageCount >= maxMessages && (
              <div className="px-4 py-2 bg-yellow-100 border-t border-yellow-200">
                <p className="text-sm text-yellow-800 text-center">
                  Demo limiti doldu. Daha fazla mesaj için kayıt olun!
                </p>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  disabled={isLoading || messageCount >= maxMessages}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading || messageCount >= maxMessages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {messageCount}/{maxMessages} mesaj kullanıldı
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const plans = [
  {
    name: 'Basic',
    price: '$29',
    period: '/month',
    features: [
      '1,000 messages/month',
      'Basic customization',
      'Email support',
      'Chat widget'
    ],
    id: 'basic'
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    features: [
      '10,000 messages/month',
      'Advanced customization',
      'Priority support',
      'Analytics dashboard',
      'Custom branding'
    ],
    id: 'pro',
    popular: true
  }
];

export default function Home() {
  const [loading, setLoading] = useState({});

  const handleSubscribe = async (planId) => {
    setLoading(prev => ({ ...prev, [planId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/create-checkout`,
        { plan: planId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [planId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ChatBot SaaS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/demo-dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
                Try Demo
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900">
                Login
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-6xl">
            AI-Powered Customer Support
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Deploy intelligent chatbots on your website in minutes. 
            Provide 24/7 customer support with our easy-to-use platform.
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h3 className="text-3xl font-extrabold text-gray-900">Choose Your Plan</h3>
          <p className="mt-4 text-lg text-gray-600">Start your free trial today</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg shadow-lg ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                    Popular
                  </span>
                </div>
              )}
              
              <div className="bg-white rounded-lg p-8">
                <div className="text-center">
                  <h4 className="text-2xl font-semibold text-gray-900">{plan.name}</h4>
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="ml-1 text-xl text-gray-500">{plan.period}</span>
                  </div>
                </div>
                
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading[plan.id]}
                    className={`w-full py-3 px-4 rounded-md font-medium ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    } ${loading[plan.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading[plan.id] ? 'Processing...' : `Get Started with ${plan.name}`}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Chat Widget */}
      <DemoChatWidget />
    </div>
  );
} 