#!/usr/bin/env python3
"""
Google Maps Geocoding Script for Venue Data
This script clears existing coordinates and geocodes all venues using Google Maps API
"""

import json
import time
import requests
import csv
from typing import Dict, List, Tuple, Optional

class GoogleGeocoder:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/geocode/json"
        self.geocoded_count = 0
        self.failed_count = 0
        self.rate_limit_delay = 0.1  # 100ms delay between requests
        
    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Geocode a single address using Google Maps API
        Returns (latitude, longitude) or None if failed
        """
        try:
            params = {
                'address': address,
                'key': self.api_key,
                'region': 'uk'  # Bias results towards UK
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                location = data['results'][0]['geometry']['location']
                lat = location['lat']
                lng = location['lng']
                
                # Verify the result is in the UK (rough bounds)
                if 49.5 <= lat <= 61.0 and -8.0 <= lng <= 2.0:
                    return (lat, lng)
                else:
                    print(f"⚠️  Geocoded result outside UK bounds: {address} -> ({lat}, {lng})")
                    return None
            else:
                print(f"❌ Geocoding failed for: {address} - Status: {data['status']}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error for {address}: {e}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error for {address}: {e}")
            return None
    
    def geocode_venues(self, venues: List[Dict]) -> List[Dict]:
        """
        Geocode all venues in the list
        """
        print(f"🔄 Starting geocoding of {len(venues)} venues...")
        print("=" * 60)
        
        for i, venue in enumerate(venues, 1):
            # Clear existing coordinates
            venue['latitude'] = None
            venue['longitude'] = None
            venue['coordinates'] = None
            
            # Create full address for geocoding
            address_parts = []
            if venue.get('address1'):
                address_parts.append(venue['address1'])
            if venue.get('address2'):
                address_parts.append(venue['address2'])
            if venue.get('town'):
                address_parts.append(venue['town'])
            if venue.get('postCode'):
                address_parts.append(venue['postCode'])
            if venue.get('county'):
                address_parts.append(venue['county'])
            if venue.get('country'):
                address_parts.append(venue['country'])
            
            full_address = ', '.join(filter(None, address_parts))
            
            print(f"[{i:3d}/{len(venues)}] Geocoding: {venue['name']}")
            print(f"         Address: {full_address}")
            
            # Geocode the address
            coordinates = self.geocode_address(full_address)
            
            if coordinates:
                lat, lng = coordinates
                venue['latitude'] = lat
                venue['longitude'] = lng
                venue['coordinates'] = [lat, lng]
                venue['fullAddress'] = full_address
                
                self.geocoded_count += 1
                print(f"         ✅ Success: ({lat:.6f}, {lng:.6f})")
            else:
                self.failed_count += 1
                print(f"         ❌ Failed to geocode")
            
            # Rate limiting
            time.sleep(self.rate_limit_delay)
            print()
        
        return venues
    
    def print_summary(self):
        """Print geocoding summary"""
        print("=" * 60)
        print("📊 GEOCODING SUMMARY")
        print("=" * 60)
        print(f"✅ Successfully geocoded: {self.geocoded_count}")
        print(f"❌ Failed to geocode: {self.failed_count}")
        print(f"📈 Success rate: {(self.geocoded_count / (self.geocoded_count + self.failed_count)) * 100:.1f}%")
        print("=" * 60)

def load_venue_data() -> List[Dict]:
    """Load venue data from venue-data.js"""
    print("📁 Loading venue data from venue-data.js...")
    
    try:
        with open('venue-data.js', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract the VENUE_DATA array from the JavaScript file
        start_marker = 'const VENUE_DATA = ['
        end_marker = '];'
        
        start_idx = content.find(start_marker)
        if start_idx == -1:
            raise ValueError("Could not find VENUE_DATA array in venue-data.js")
        
        start_idx += len(start_marker)
        end_idx = content.find(end_marker, start_idx)
        if end_idx == -1:
            raise ValueError("Could not find end of VENUE_DATA array in venue-data.js")
        
        json_str = content[start_idx:end_idx].strip()
        
        # Clean up the JSON string - remove trailing commas and fix common issues
        lines = json_str.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Remove trailing commas before closing brackets/braces
            if line.strip().endswith(','):
                # Check if next non-empty line starts with } or ]
                next_line_idx = len(cleaned_lines)
                while next_line_idx < len(lines) and not lines[next_line_idx].strip():
                    next_line_idx += 1
                
                if next_line_idx < len(lines):
                    next_line = lines[next_line_idx].strip()
                    if next_line.startswith('}') or next_line.startswith(']'):
                        line = line.rstrip(',')
            
            cleaned_lines.append(line)
        
        json_str = '\n'.join(cleaned_lines)
        
        # Parse the JSON data
        venues = json.loads(json_str)
        print(f"✅ Loaded {len(venues)} venues")
        return venues
        
    except Exception as e:
        print(f"❌ Error loading venue data: {e}")
        print("Trying alternative parsing method...")
        
        # Alternative method: try to extract just the venue objects
        try:
            import re
            
            # Find all venue objects using regex
            pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
            matches = re.findall(pattern, content)
            
            venues = []
            for match in matches:
                try:
                    # Clean up the match
                    clean_match = match.strip()
                    if clean_match.startswith('{') and clean_match.endswith('}'):
                        venue = json.loads(clean_match)
                        if 'id' in venue and 'name' in venue:
                            venues.append(venue)
                except:
                    continue
            
            if venues:
                print(f"✅ Loaded {len(venues)} venues using alternative method")
                return venues
            else:
                raise ValueError("Could not parse any venue data")
                
        except Exception as e2:
            print(f"❌ Alternative parsing also failed: {e2}")
            return []

def save_venue_data(venues: List[Dict]):
    """Save updated venue data back to venue-data.js"""
    print("💾 Saving updated venue data to venue-data.js...")
    
    try:
        # Create the JavaScript content
        js_content = f"""// Venue data embedded from CSV
// {sum(1 for v in venues if v.get('coordinates'))} venues have coordinates, {sum(1 for v in venues if not v.get('coordinates'))} need geocoding
const VENUE_DATA = {json.dumps(venues, indent=2)};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = VENUE_DATA;
}}"""
        
        with open('venue-data.js', 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        print("✅ Venue data saved successfully")
        
    except Exception as e:
        print(f"❌ Error saving venue data: {e}")

def main():
    print("🗺️  Google Maps Geocoding for Venue Data")
    print("=" * 60)
    
    # Get Google Maps API key
    api_key = input("Enter your Google Maps API key: ").strip()
    if not api_key:
        print("❌ API key is required")
        return
    
    # Load venue data
    venues = load_venue_data()
    if not venues:
        print("❌ No venue data loaded")
        return
    
    # Confirm geocoding
    print(f"\n⚠️  This will clear ALL existing coordinates and geocode {len(venues)} venues")
    print("This may take several minutes and will use your Google Maps API quota.")
    confirm = input("Continue? (y/N): ").strip().lower()
    
    if confirm != 'y':
        print("❌ Geocoding cancelled")
        return
    
    # Initialize geocoder
    geocoder = GoogleGeocoder(api_key)
    
    # Geocode all venues
    updated_venues = geocoder.geocode_venues(venues)
    
    # Print summary
    geocoder.print_summary()
    
    # Save updated data
    save_venue_data(updated_venues)
    
    print("\n🎉 Geocoding complete!")
    print("You can now refresh your map to see the updated coordinates.")

if __name__ == "__main__":
    main()
