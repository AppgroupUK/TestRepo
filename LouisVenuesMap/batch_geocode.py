#!/usr/bin/env python3
"""
Batch geocoding script to get coordinates for all venues.
This will make the map load much faster by pre-geocoding all addresses.
"""

import csv
import json
import time
import urllib.request
import urllib.parse
import urllib.error

def geocode_address(address, max_retries=3):
    """
    Geocode a single address using Nominatim (OpenStreetMap's geocoding service).
    Returns (latitude, longitude) or (None, None) if failed.
    """
    for attempt in range(max_retries):
        try:
            # Clean up the address
            clean_address = address.strip()
            if not clean_address:
                return None, None
            
            # Use Nominatim geocoding service
            url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(clean_address)}&limit=1&countrycodes=gb,us,ca,au,ie"
            
            # Create request with proper headers
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'VenueMapApp/1.0 (contact@example.com)')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    if data and len(data) > 0:
                        lat = float(data[0]['lat'])
                        lng = float(data[0]['lon'])
                        print(f"✅ Geocoded: {clean_address[:50]}... -> {lat:.4f}, {lng:.4f}")
                        return lat, lng
                    else:
                        print(f"❌ No results for: {clean_address[:50]}...")
                        return None, None
                else:
                    print(f"⚠️  HTTP {response.status} for: {clean_address[:50]}...")
                
        except urllib.error.HTTPError as e:
            print(f"⚠️  HTTP Error {e.code} for: {clean_address[:50]}... (attempt {attempt + 1})")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
        except Exception as e:
            print(f"⚠️  Error geocoding {clean_address[:50]}... (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            
    return None, None

def batch_geocode_venues():
    """
    Geocode all venues in the CSV file and save results.
    """
    print("🚀 Starting batch geocoding of all venues...")
    print("⏱️  This may take 10-20 minutes depending on the number of venues")
    print("🔄 Processing venues in batches with rate limiting...")
    
    # Read the original CSV
    venues = []
    with open('JW and Smirnoff Venues - Sheet1.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        fieldnames = reader.fieldnames + ['Latitude', 'Longitude']
        
        for row in reader:
            venues.append(row)
    
    print(f"📊 Found {len(venues)} venues to geocode")
    
    # Process venues in batches
    batch_size = 5  # Small batches to respect rate limits
    delay_between_requests = 1.2  # 1.2 seconds between requests (Nominatim allows 1 req/sec)
    delay_between_batches = 2  # 2 seconds between batches
    
    geocoded_count = 0
    failed_count = 0
    
    for i in range(0, len(venues), batch_size):
        batch = venues[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(venues) + batch_size - 1) // batch_size
        
        print(f"\n🔄 Processing batch {batch_num}/{total_batches} ({len(batch)} venues)")
        
        for j, venue in enumerate(batch):
            # Build full address
            address_parts = [
                venue.get('Address1', '').strip(),
                venue.get('Address2', '').strip(),
                venue.get('Town', '').strip(),
                venue.get('PostCode', '').strip(),
                venue.get('Country', '').strip()
            ]
            full_address = ', '.join([part for part in address_parts if part])
            
            if not full_address:
                print(f"⚠️  Skipping {venue.get('Name', 'Unknown')} - no address")
                failed_count += 1
                continue
            
            # Geocode the address
            lat, lng = geocode_address(full_address)
            
            if lat is not None and lng is not None:
                venue['Latitude'] = str(lat)
                venue['Longitude'] = str(lng)
                geocoded_count += 1
            else:
                venue['Latitude'] = ''
                venue['Longitude'] = ''
                failed_count += 1
            
            # Rate limiting - wait between requests
            if j < len(batch) - 1:  # Don't wait after the last item in batch
                time.sleep(delay_between_requests)
        
        # Wait between batches
        if i + batch_size < len(venues):
            print(f"⏳ Waiting {delay_between_batches}s before next batch...")
            time.sleep(delay_between_batches)
    
    # Save the results
    output_file = 'JW and Smirnoff Venues - Sheet1_with_coords.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(venues)
    
    print(f"\n🎉 Batch geocoding complete!")
    print(f"✅ Successfully geocoded: {geocoded_count} venues")
    print(f"❌ Failed to geocode: {failed_count} venues")
    print(f"📁 Results saved to: {output_file}")
    print(f"📊 Success rate: {(geocoded_count / len(venues)) * 100:.1f}%")
    
    return geocoded_count, failed_count

def create_geocoding_report(geocoded_count, failed_count, total_count):
    """Create a simple report of the geocoding results."""
    report = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_venues': total_count,
        'geocoded_successfully': geocoded_count,
        'failed_to_geocode': failed_count,
        'success_rate': f"{(geocoded_count / total_count) * 100:.1f}%"
    }
    
    with open('geocoding_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"📋 Geocoding report saved to: geocoding_report.json")

if __name__ == "__main__":
    try:
        geocoded, failed = batch_geocode_venues()
        create_geocoding_report(geocoded, failed, geocoded + failed)
        
        print(f"\n🔄 Now regenerating venue data...")
        import subprocess
        result = subprocess.run(['python3', 'regenerate_data.py'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Venue data regenerated successfully!")
            print("🌐 Your map will now load much faster!")
        else:
            print("⚠️  Error regenerating venue data:")
            print(result.stderr)
            
    except KeyboardInterrupt:
        print("\n🛑 Geocoding interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during batch geocoding: {e}")
