import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [chatLogs, setChatLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newApiKey, setNewApiKey] = useState('');
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    fetchProfile();
    fetchChatLogs();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/tenant/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Eğer API hatası varsa, demo moduna yönlendir
      if (error.response?.status === 401) {
        alert('Please login to access the dashboard');
        router.push('/login');
      }
    }
  };

  const fetchChatLogs = async () => {
    try {
      const response = await api.get('/tenant/chat-logs?limit=10');
      setChatLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch chat logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateApiKey = async () => {
    try {
      const response = await api.post('/tenant/regenerate-api-key');
      setNewApiKey(response.data.apiKey);
      setProfile(prev => ({ ...prev, api_key: response.data.apiKey }));
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
      alert('Failed to regenerate API key');
    }
  };

  const getEmbedCode = () => {
    if (!profile) return '';
    
    return `<!-- ChatBot Widget -->
<script>
  window.ChatbotConfig = {
    apiKey: "${profile.api_key}",
    webhookUrl: "${process.env.NEXT_PUBLIC_WIDGET_URL}/webhook/chat/${profile.id}",
    theme: {
      primaryColor: "#3B82F6",
      position: "bottom-right"
    }
  };
</script>
<script src="${process.env.NEXT_PUBLIC_WIDGET_URL}/chat-widget.js"></script>`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <Link href="/demo-dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
                Try Demo
              </Link>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'integration', name: 'Integration' },
              { id: 'logs', name: 'Chat Logs' },
              { id: 'settings', name: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Current Plan
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 capitalize">
                        {profile?.plan || 'Basic'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">M</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Messages This Month
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {chatLogs.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">S</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Status
                      </dt>
                      <dd className="text-lg font-medium text-green-600">
                        Active
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integration' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Website Integration
            </h3>
            <p className="text-gray-600 mb-4">
              Copy and paste this code into your website's HTML to add the chatbot widget:
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-sm overflow-x-auto">
                <code>{getEmbedCode()}</code>
              </pre>
            </div>
            
            <button
              onClick={() => copyToClipboard(getEmbedCode())}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Copy Code
            </button>

            <div className="mt-8">
              <h4 className="text-md font-medium text-gray-900 mb-2">API Information</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600">API Key:</label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                      {profile?.api_key}
                    </code>
                    <button
                      onClick={regenerateApiKey}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Webhook URL:</label>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm block">
                    {process.env.NEXT_PUBLIC_WIDGET_URL}/webhook/chat/{profile?.id}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Chat Logs</h3>
            </div>
            <div className="overflow-hidden">
              {chatLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No chat messages yet. Once your chatbot starts receiving messages, they'll appear here.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {chatLogs.map((log, index) => (
                    <li key={index} className="px-6 py-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900">User: </span>
                          <span className="text-sm text-gray-700">{log.message}</span>
                        </div>
                        {log.response && (
                          <div>
                            <span className="text-sm font-medium text-blue-600">Bot: </span>
                            <span className="text-sm text-gray-700">{log.response}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <div className="mt-1 flex items-center justify-between">
                  <span className="capitalize text-gray-900">{profile?.plan || 'Basic'}</span>
                  <Link href="/" className="text-blue-600 hover:text-blue-500">
                    Upgrade Plan
                  </Link>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Account Created</label>
                <p className="mt-1 text-gray-900">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 