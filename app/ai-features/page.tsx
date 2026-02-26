'use client';

import React, { useState } from 'react';
import { ChatbotWidget, PriceAlertManager } from '@/components/enterprise-features';
import { MessageCircle, TrendingDown } from 'lucide-react';

export default function AIFeaturesPage() {
  const [activeTab, setActiveTab] = useState<'chatbot' | 'price-alerts'>('chatbot');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Features</h1>
          <p className="text-gray-600 mt-2">Smart Chatbot & Price Prediction</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'chatbot'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <MessageCircle size={20} />
            AI Chatbot Support
          </button>
          <button
            onClick={() => setActiveTab('price-alerts')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'price-alerts'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <TrendingDown size={20} />
            Price Prediction & Alerts
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'chatbot' && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Chatbot Assistant</h2>
                <p className="text-gray-600 mb-6">
                  Get instant answers to your booking questions. Our AI chatbot can help with bookings, 
                  payments, cancellations, and more. Ask away!
                </p>
                <ChatbotWidget />
              </div>
            )}

            {activeTab === 'price-alerts' && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Price Alerts</h2>
                <p className="text-gray-600 mb-6">
                  Never miss a price drop! Set alerts for your favorite movies and get notified 
                  when prices go down. Our AI analyzes 30-day trends to give you the best recommendations.
                </p>
                <PriceAlertManager />
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1">
            {activeTab === 'chatbot' && (
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What I Can Help With:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Booking inquiries & seat selection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Payment & refund questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Cancellation & modifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Technical issues & FAQs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Human escalation when needed</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    💡 Tip: Start with common questions like "How do I book tickets?" or 
                    "What's your refund policy?"
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'price-alerts' && (
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Price Prediction Features:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>30-day price trend analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Real-time price volatility tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Smart "Book Now" or "Wait" recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Instant notifications on price drops</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Multi-movie & theatre tracking</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    📊 Tip: Set alerts on trending movies to catch the best deals as prices fluctuate.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-blue-600 text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Responses</h3>
            <p className="text-sm text-gray-600">
              Our chatbot uses intelligent keyword matching to provide instant, relevant answers.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-green-600 text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Analytics</h3>
            <p className="text-sm text-gray-600">
              Advanced price prediction with trend analysis helps you book at the perfect time.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-purple-600 text-3xl mb-3">🔔</div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-Time Alerts</h3>
            <p className="text-sm text-gray-600">
              Get instant notifications when prices drop for your favorite movies and theatres.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600 text-sm">
            These AI features are available 24/7 to enhance your movie booking experience.
          </p>
        </div>
      </div>
    </div>
  );
}
