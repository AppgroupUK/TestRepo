#!/usr/bin/env python3
"""
Advanced geocoding script that tries multiple services to get coordinates
for venues that don't have them yet.
"""

import csv
import json
import time
import urllib.request
import urllib.parse
import urllib.error

class GeocodingService:
    def __init__(self, name, rate_limit_delay=1.0):
        self.name = name
        self.rate_limit_delay = rate_limit_delay
        self.last_request_time = 0
    
    def wait_for_rate_limit(self):
        """Ensure we don't exceed rate limits."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - time_since_last)
        self.last_request_time = time.time()

class NominatimGeocoder(GeocodingService):
    def __init__(self):
        super().__init__("Nominatim", 1.2)  # 1 request per second
    
    def geocode(self, address):
        """Geocode using OpenStreetMap Nominatim."""
        try:
            self.wait_for_rate_limit()
            
            url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(address)}&limit=1&countrycodes=gb&addressdetails=1"
            
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'VenueMapApp/1.0 (contact@example.com)')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    if data and len(data) > 0:
                        lat = float(data[0]['lat'])
                        lng = float(data[0]['lon'])
                        return lat, lng
            return None, None
        except Exception as e:
            print(f"  ⚠️  Nominatim error: {e}")
            return None, None

class GoogleGeocoder(GeocodingService):
    def __init__(self, api_key=None):
        super().__init__("Google Maps", 0.1)  # 10 requests per second
        self.api_key = api_key
    
    def geocode(self, address):
        """Geocode using Google Maps API (requires API key)."""
        if not self.api_key:
            return None, None
        
        try:
            self.wait_for_rate_limit()
            
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address={urllib.parse.quote(address)}&key={self.api_key}&region=gb"
            
            with urllib.request.urlopen(url, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    if data.get('status') == 'OK' and data.get('results'):
                        location = data['results'][0]['geometry']['location']
                        return location['lat'], location['lng']
            return None, None
        except Exception as e:
            print(f"  ⚠️  Google Maps error: {e}")
            return None, None

class MapboxGeocoder(GeocodingService):
    def __init__(self, access_token=None):
        super().__init__("Mapbox", 0.1)  # 10 requests per second
        self.access_token = access_token
    
    def geocode(self, address):
        """Geocode using Mapbox API (requires access token)."""
        if not self.access_token:
            return None, None
        
        try:
            self.wait_for_rate_limit()
            
            url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{urllib.parse.quote(address)}.json?access_token={self.access_token}&country=GB&limit=1"
            
            with urllib.request.urlopen(url, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    if data.get('features') and len(data['features']) > 0:
                        coords = data['features'][0]['center']
                        return coords[1], coords[0]  # Mapbox returns [lng, lat]
            return None, None
        except Exception as e:
            print(f"  ⚠️  Mapbox error: {e}")
            return None, None

class BingGeocoder(GeocodingService):
    def __init__(self, api_key=None):
        super().__init__("Bing Maps", 0.1)  # 10 requests per second
        self.api_key = api_key
    
    def geocode(self, address):
        """Geocode using Bing Maps API (requires API key)."""
        if not self.api_key:
            return None, None
        
        try:
            self.wait_for_rate_limit()
            
            url = f"https://dev.virtualearth.net/REST/v1/Locations?q={urllib.parse.quote(address)}&key={self.api_key}&c=GB"
            
            with urllib.request.urlopen(url, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    if data.get('resourceSets') and data['resourceSets'][0].get('resources'):
                        coords = data['resourceSets'][0]['resources'][0]['point']['coordinates']
                        return coords[0], coords[1]  # Bing returns [lat, lng]
            return None, None
        except Exception as e:
            print(f"  ⚠️  Bing Maps error: {e}")
            return None, None

def is_coordinate_in_uk(lat, lng):
    """Check if coordinates are within the UK bounding box."""
    try:
        lat = float(lat)
        lng = float(lng)
        return (49.8 <= lat <= 60.9 and -8.2 <= lng <= 1.8)
    except (ValueError, TypeError):
        return False

def advanced_geocode_venues():
    """
    Try to geocode venues using multiple services.
    """
    print("🚀 Advanced geocoding for remaining venues...")
    
    # Get Google Maps API key from user
    google_api_key = input("Enter your Google Maps API key: ").strip()
    
    # Initialize geocoding services
    geocoders = [
        GoogleGeocoder(google_api_key),  # Google Maps (most accurate)
        NominatimGeocoder(),  # Free fallback
        # Uncomment these if you have other API keys:
        # MapboxGeocoder("YOUR_MAPBOX_ACCESS_TOKEN"),
        # BingGeocoder("YOUR_BING_API_KEY"),
    ]
    
    # Read venues that need geocoding from the restored CSV
    venues_to_geocode = []
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if not row.get('Latitude') or not row.get('Longitude'):
                venues_to_geocode.append(row)
    
    print(f"📍 Found {len(venues_to_geocode)} venues that need geocoding")
    
    geocoded_count = 0
    failed_count = 0
    
    for i, venue in enumerate(venues_to_geocode, 1):
        print(f"\n🔄 Processing {i}/{len(venues_to_geocode)}: {venue.get('Name', 'Unknown')[:50]}...")
        
        # Build address
        address_parts = [
            venue.get('Address1', '').strip(),
            venue.get('Address2', '').strip(),
            venue.get('Town', '').strip(),
            venue.get('PostCode', '').strip(),
            venue.get('Country', '').strip()
        ]
        full_address = ', '.join([part for part in address_parts if part])
        
        if not full_address:
            print(f"  ⚠️  No address - skipping")
            failed_count += 1
            continue
        
        # Try each geocoding service
        success = False
        for geocoder in geocoders:
            print(f"  🔍 Trying {geocoder.name}...")
            lat, lng = geocoder.geocode(full_address)
            
            if lat and lng and is_coordinate_in_uk(lat, lng):
                # Found valid UK coordinates
                venue['Latitude'] = str(lat)
                venue['Longitude'] = str(lng)
                print(f"  ✅ Success with {geocoder.name}: {lat:.4f}, {lng:.4f}")
                geocoded_count += 1
                success = True
                break
            elif lat and lng:
                print(f"  ⚠️  {geocoder.name} returned coordinates outside UK: {lat:.4f}, {lng:.4f}")
            else:
                print(f"  ❌ {geocoder.name} failed")
        
        if not success:
            print(f"  ❌ All geocoding services failed")
            failed_count += 1
    
    # Save updated CSV - preserve all venues
    print(f"\n💾 Saving updated coordinates...")
    
    # Load all venues from the restored CSV
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        fieldnames = reader.fieldnames
        all_venues = list(reader)
    
    # Create a lookup for geocoded venues
    geocoded_venues = {v.get('Name', ''): v for v in venues_to_geocode if v.get('Latitude') and v.get('Longitude')}
    
    # Update venues with new coordinates
    updated_count = 0
    for venue in all_venues:
        name = venue.get('Name', '')
        if name in geocoded_venues:
            venue['Latitude'] = geocoded_venues[name]['Latitude']
            venue['Longitude'] = geocoded_venues[name]['Longitude']
            updated_count += 1
    
    # Save the updated CSV
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_venues)
    
    print(f"✅ Updated {updated_count} venues with new coordinates")
    print(f"📊 Total venues preserved: {len(all_venues)}")
    
    print(f"\n🎉 Advanced geocoding complete!")
    print(f"✅ Successfully geocoded: {geocoded_count} venues")
    print(f"❌ Failed to geocode: {failed_count} venues")
    print(f"📊 Success rate: {(geocoded_count / len(venues_to_geocode)) * 100:.1f}%")
    
    return geocoded_count, failed_count

def show_api_key_instructions():
    """Show instructions for getting API keys."""
    print("\n🔑 To improve geocoding success rate, you can add API keys:")
    print("1. Google Maps API: https://developers.google.com/maps/documentation/geocoding/get-api-key")
    print("2. Mapbox API: https://account.mapbox.com/access-tokens/")
    print("3. Bing Maps API: https://www.microsoft.com/en-us/maps/create-a-bing-maps-key")
    print("\nThen uncomment the relevant lines in this script and add your keys.")

if __name__ == "__main__":
    show_api_key_instructions()
    
    try:
        geocoded, failed = advanced_geocode_venues()
        
        print(f"\n🔄 Regenerating venue data...")
        import subprocess
        result = subprocess.run(['python3', 'regenerate_data.py'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Venue data regenerated successfully!")
            print("🌐 Your map will now have even more venues with coordinates!")
        else:
            print("⚠️  Error regenerating venue data:")
            print(result.stderr)
            
    except KeyboardInterrupt:
        print("\n🛑 Geocoding interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during advanced geocoding: {e}")
