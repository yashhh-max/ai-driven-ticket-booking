'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, MapPin, Heart, CreditCard, Receipt, Gift, Award, Settings } from 'lucide-react'

import ProfileSection from '@/components/account/profile-section'
import LocationsSection from '@/components/account/locations-section'
import WishlistSection from '@/components/account/wishlist-section'
import PaymentSection from '@/components/account/payment-section'
import TransactionsSection from '@/components/account/transactions-section'
import OffersSection from '@/components/account/offers-section'
import LoyaltySection from '@/components/account/loyalty-section'
import SettingsSection from '@/components/account/settings-section'

export default function MyAccountPage() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Account</h1>
          <p className="mt-2 text-muted-foreground">Manage your profile, bookings, and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Locations</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Offers</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Loyalty</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSection />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <LocationsSection />
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-6">
            <WishlistSection />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <PaymentSection />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionsSection />
          </TabsContent>

          <TabsContent value="offers" className="space-y-6">
            <OffersSection />
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-6">
            <LoyaltySection />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
