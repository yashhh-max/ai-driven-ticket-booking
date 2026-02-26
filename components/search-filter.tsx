'use client';

import React, { useState } from 'react';
import { Search, MapPin, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchFilterProps {
  onSearch: (query: string, location: string, autoBookOnly?: boolean) => void;
  isLoading?: boolean;
}

export function SearchFilter({ onSearch, isLoading = false }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [autoBookOnly, setAutoBookOnly] = useState(false);

  // Popular cinema locations - you can fetch these from database
  const locations = [
    { id: 'all', name: 'All Locations' },
    { id: 'hyderabad', name: 'Hyderabad' },
    { id: 'bangalore', name: 'Bangalore' },
    { id: 'mumbai', name: 'Mumbai' },
    { id: 'delhi', name: 'Delhi' },
    { id: 'pune', name: 'Pune' },
    { id: 'chennai', name: 'Chennai' },
    { id: 'kolkata', name: 'Kolkata' },
    { id: 'jaipur', name: 'Jaipur' },
  ];

  const handleSearch = () => {
    onSearch(searchQuery, selectedLocation, autoBookOnly);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full bg-black rounded-lg shadow-md p-4 m-2">
      <div className="space-y-3 bg-black rounded p-2">
        <div className="flex gap-3 items-end">
          {/* Search Input */}
          <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white" />
          <Input
            id="search-movies"
            name="search-movies"
            type="text"
            placeholder="Search movies, actors, directors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9 py-2 text-sm bg-gray-100 border-gray-300 text-gray-700 placeholder-gray-500"
          />
        </div>

        {/* Location Dropdown */}
        <select
          id="location-select"
          name="location-select"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {locations.map((location) => (
            <option key={location.id} value={location.id} className="text-gray-700">
              📍 {location.name}
            </option>
          ))}
        </select>

        {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="py-2 px-6 text-sm"
            size="sm"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Auto-Booking Filter */}
        <div className="flex items-center gap-2 pl-1">
          <input
            type="checkbox"
            id="auto-book"
            checked={autoBookOnly}
            onChange={(e) => setAutoBookOnly(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <label htmlFor="auto-book" className="flex items-center gap-2 cursor-pointer text-sm text-white">
            <Zap className="h-4 w-4 text-amber-500" />
            Available for Auto-booking
          </label>
        </div>
      </div>
    </div>
  );
}

// Mini search bar variant for header
export function SearchBarMini() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const handleSearch = () => {
    // Navigate to search results or filter results
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedLocation !== 'all') params.append('location', selectedLocation);
    window.location.href = `/movies?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-2 max-w-2xl">
      <Search className="h-5 w-5 text-gray-400 ml-2" />
      <input
        id="search-mini"
        name="search-mini"
        type="text"
        placeholder="Search movies..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        className="flex-1 outline-none py-2 px-2 text-sm"
      />
      <select
        id="location-mini"
        name="location-mini"
        value={selectedLocation}
        onChange={(e) => setSelectedLocation(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
      >
        <option value="all">All Cities</option>
        <option value="hyderabad">Hyderabad</option>
        <option value="bangalore">Bangalore</option>
        <option value="mumbai">Mumbai</option>
        <option value="delhi">Delhi</option>
        <option value="pune">Pune</option>
      </select>
      <Button
        onClick={handleSearch}
        size="sm"
        className="mr-1"
      >
        Search
      </Button>
    </div>
  );
}
