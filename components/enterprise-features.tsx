import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, Gift, MessageSquare, Globe, AlertCircle, Eye, Users } from 'lucide-react';

// ============================================================================
// 1. PAYMENT GATEWAY SELECTOR COMPONENT
// ============================================================================

interface PaymentGatewaySelectorProps {
  onSelect: (gateway: 'razorpay' | 'paypal' | 'googlepay' | 'applepay') => void;
  disabled?: boolean;
}

export function PaymentGatewaySelector({ onSelect, disabled = false }: PaymentGatewaySelectorProps) {
  const [selected, setSelected] = useState<string>('razorpay');

  const gateways = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Fast & Secure',
      icon: CreditCard,
      fees: '2%'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'International',
      icon: CreditCard,
      fees: '2.5%'
    },
    {
      id: 'googlepay',
      name: 'Google Pay',
      description: 'One-tap Payment',
      icon: CreditCard,
      fees: '1.5%'
    },
    {
      id: 'applepay',
      name: 'Apple Pay',
      description: 'iPhone/Mac Only',
      icon: CreditCard,
      fees: '1.5%'
    }
  ];

  const handleSelect = (gatewayId: string) => {
    setSelected(gatewayId);
    onSelect(gatewayId as any);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Select Payment Method</h3>
      <div className="grid grid-cols-2 gap-4">
        {gateways.map((gateway) => (
          <button
            key={gateway.id}
            onClick={() => handleSelect(gateway.id)}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 transition-all ${
              selected === gateway.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-left">
              <h4 className="font-semibold text-sm text-gray-900">{gateway.name}</h4>
              <p className="text-xs text-gray-600">{gateway.description}</p>
              <p className="text-xs text-green-600 font-medium mt-2">{gateway.fees} processing fee</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 2. PROMO CODE INPUT COMPONENT
// ============================================================================

interface PromoCodeInputProps {
  bookingAmount: number;
  onApply: (discount: {
    code: string;
    discount: number;
    finalAmount: number;
  }) => void;
}

export function PromoCodeInput({ bookingAmount, onApply }: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [discount, setDiscount] = useState<any>(null);

  const handleValidate = async () => {
    setIsValidating(true);
    setError('');
    
    try {
      const response = await fetch('/api/promo-codes', {
        method: 'POST',
        body: JSON.stringify({
          code,
          bookingAmount
        })
      });

      const data = await response.json();
      if (!data.success) {
        setError(data.message || 'Invalid promo code');
        setDiscount(null);
        return;
      }

      setDiscount(data);
      onApply({
        code,
        discount: data.discountAmount,
        finalAmount: data.finalAmount
      });
    } catch (err) {
      setError('Failed to validate code');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Promo Code</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter promo code"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleValidate}
          disabled={isValidating || !code}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isValidating ? 'Checking...' : 'Apply'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {discount && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            <strong>Save ₹{discount.discountAmount}</strong> ({discount.discountPercentage}% off)
          </p>
          <p className="text-sm text-green-700 mt-1">
            Final Amount: <strong>₹{discount.finalAmount}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. LANGUAGE SELECTOR COMPONENT
// ============================================================================

interface LanguageSelectorProps {
  onLanguageChange: (languageId: string) => void;
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<any[]>([]);
  const [selected, setSelected] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('/api/translations');
        const data = await response.json();
        setLanguages(data.languages || []);
      } catch (err) {
        console.error('Failed to fetch languages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  const handleLanguageChange = async (languageId: string) => {
    setSelected(languageId);
    
    try {
      await fetch('/api/translations', {
        method: 'PUT',
        body: JSON.stringify({ languageId })
      });
      onLanguageChange(languageId);
    } catch (err) {
      console.error('Failed to set language preference:', err);
    }
  };

  if (loading) {
    return <div className="h-10 bg-gray-200 rounded animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-2">
      <Globe size={20} className="text-gray-600" />
      <select
        value={selected}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.display_name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// 4. CHATBOT WIDGET COMPONENT
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  message: string;
  timestamp: string;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      message: input,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          message: input,
          languageId: 'lang-en'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_bot`,
          role: 'bot',
          message: data.response,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Booking Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:opacity-80"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-4">
                <MessageSquare className="mx-auto mb-2 opacity-50" size={24} />
                <p>Ask me anything about bookings!</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// 5. PRICE ALERT MANAGER COMPONENT
// ============================================================================

interface PriceAlertManagerProps {
  movieId?: string;
  theaterId?: string;
}

export function PriceAlertManager({ movieId, theaterId }: PriceAlertManagerProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [targetPrice, setTargetPrice] = useState('200');
  const [isCreating, setIsCreating] = useState(false);
  const [priceInfo, setPriceInfo] = useState<any>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/price-alerts');
      const data = await response.json();
      setAlerts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const handleCreateAlert = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/price-alerts', {
        method: 'POST',
        body: JSON.stringify({
          movieId,
          theaterId,
          targetPrice: parseInt(targetPrice)
        })
      });
      const data = await response.json();
      if (data.success) {
        setTargetPrice('200');
        fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to create alert:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await fetch(`/api/price-alerts?id=${alertId}`, {
        method: 'DELETE'
      });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Price Alerts</h3>

      {/* Create Alert */}
      <div className="flex gap-2">
        <input
          type="number"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="Target price (₹)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreateAlert}
          disabled={isCreating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Eye size={16} />
          Watch
        </button>
      </div>

      {/* Active Alerts */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500">No active price alerts</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{alert.movie_title}</p>
                <p className="text-gray-600">Target: ₹{alert.target_price}</p>
              </div>
              <button
                onClick={() => handleDeleteAlert(alert.id)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 6. GROUP BOOKING NOTICE COMPONENT
// ============================================================================

interface GroupBookingNoticeProps {
  ticketCount: number;
  pricePerTicket: number;
}

export function GroupBookingNotice({ ticketCount, pricePerTicket }: GroupBookingNoticeProps) {
  let discountPercentage = 0;
  let discountAmount = 0;

  if (ticketCount >= 20) {
    discountPercentage = 15;
  } else if (ticketCount >= 10) {
    discountPercentage = 10;
  } else if (ticketCount >= 5) {
    discountPercentage = 5;
  }

  if (discountPercentage > 0) {
    const originalTotal = ticketCount * pricePerTicket;
    discountAmount = (originalTotal * discountPercentage) / 100;

    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-600 p-4 rounded-r-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-bold text-green-900 flex items-center gap-2">
              <Users size={18} />
              Group Booking Discount!
            </h4>
            <p className="text-sm text-green-700 mt-1">
              {ticketCount} tickets qualify for <strong>{discountPercentage}% discount</strong>
            </p>
            <p className="text-lg font-bold text-green-600 mt-2">
              You save ₹{discountAmount.toFixed(0)}!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p className="text-sm text-blue-800">
        💡 Book 5+ tickets to unlock group discounts!
      </p>
    </div>
  );
}

// ============================================================================
// 7. EMAIL NOTIFICATION SETTINGS COMPONENT
// ============================================================================

export function EmailNotificationSettings() {
  const [preferences, setPreferences] = useState({
    bookingConfirmation: true,
    paymentReceipt: true,
    bookingReminder: true,
    cancellationAlert: true
  });

  const handleToggle = async (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
    // Save preference to backend
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Email Preferences</h3>

      {[
        { key: 'bookingConfirmation', label: 'Booking Confirmation' },
        { key: 'paymentReceipt', label: 'Payment Receipt' },
        { key: 'bookingReminder', label: 'Booking Reminder (24h before)' },
        { key: 'cancellationAlert', label: 'Cancellation Confirmation' }
      ].map(({ key, label }) => (
        <label key={key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={preferences[key as keyof typeof preferences]}
            onChange={() => handleToggle(key)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-900">{label}</span>
        </label>
      ))}
    </div>
  );
}

// ============================================================================
// 8. FRAUD ALERT DASHBOARD COMPONENT (Admin)
// ============================================================================

export function FraudAlertDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'blocked'>('pending');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fraud-detection?status=${filter}`);
      const data = await response.json();
      setAlerts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (alertId: string, status: string) => {
    try {
      await fetch('/api/fraud-detection', {
        method: 'PUT',
        body: JSON.stringify({ alertId, status })
      });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to review alert:', err);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'bg-green-100 text-green-800';
    if (score < 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Fraud Alerts</h2>
        <div className="flex gap-2">
          {(['pending', 'approved', 'blocked'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({alerts.length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No alerts found</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Alert #{alert.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-600">User: {alert.users?.email}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(alert.risk_score)}`}>
                  Risk: {(alert.risk_score * 100).toFixed(0)}%
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <p className="text-sm text-gray-700"><strong>Type:</strong> {alert.alert_type}</p>
                <p className="text-sm text-gray-700"><strong>Booking:</strong> ₹{alert.bookings?.total_amount}</p>
              </div>

              {filter === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(alert.id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(alert.id, 'blocked')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Block
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default {
  PaymentGatewaySelector,
  PromoCodeInput,
  LanguageSelector,
  ChatbotWidget,
  PriceAlertManager,
  GroupBookingNotice,
  EmailNotificationSettings,
  FraudAlertDashboard
};
