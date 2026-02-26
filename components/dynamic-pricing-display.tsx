'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DynamicPricingInfo {
  base_price: number;
  current_price: number;
  multiplier: number;
  occupancy_percentage: number;
  minutes_until_show: number;
}

interface DynamicPricingDisplayProps {
  showtimeId: string;
}

export default function DynamicPricingDisplay({
  showtimeId,
}: DynamicPricingDisplayProps) {
  const [pricing, setPricing] = useState<DynamicPricingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDynamicPricing();
    // Refresh pricing every 5 minutes
    const interval = setInterval(fetchDynamicPricing, 300000);
    return () => clearInterval(interval);
  }, [showtimeId]);

  const fetchDynamicPricing = async () => {
    try {
      const response = await fetch(
        `/api/dynamic-pricing?showtimeId=${showtimeId}`
      );
      const { data } = await response.json();
      if (data) {
        setPricing({
          base_price: data.base_price,
          current_price: data.current_price,
          multiplier: data.price_multiplier,
          occupancy_percentage: data.occupancy_percentage,
          minutes_until_show: data.time_until_show_minutes,
        });
      }
    } catch (error) {
      console.error('Error fetching dynamic pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !pricing) {
    return null;
  }

  const getPriceBadgeColor = () => {
    if (pricing.current_price > pricing.base_price * 1.2) {
      return 'bg-red-100 text-red-800';
    }
    if (pricing.current_price < pricing.base_price * 0.9) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const getPricingReason = () => {
    if (pricing.occupancy_percentage >= 80) {
      return 'High demand';
    }
    if (pricing.occupancy_percentage >= 60) {
      return 'Moderate demand';
    }
    if (pricing.minutes_until_show < 120) {
      return 'Last-minute booking';
    }
    if (pricing.minutes_until_show > 10080) {
      return 'Early bird discount';
    }
    return 'Standard pricing';
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Base Price</p>
            <p className="text-2xl font-bold">₹{pricing.base_price}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Current Price</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${getPriceBadgeColor()}`}>
                ₹{pricing.current_price}
              </p>
              <Badge className={getPriceBadgeColor()}>
                {pricing.multiplier > 1
                  ? `+${Math.round((pricing.multiplier - 1) * 100)}%`
                  : `-${Math.round((1 - pricing.multiplier) * 100)}%`}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Theater Occupancy</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${pricing.occupancy_percentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold">
                {pricing.occupancy_percentage}%
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Time Until Show</p>
            <p className="text-lg font-semibold">
              {pricing.minutes_until_show > 60
                ? `${Math.round(pricing.minutes_until_show / 60)}h`
                : `${pricing.minutes_until_show}m`}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Reason:</strong> {getPricingReason()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
