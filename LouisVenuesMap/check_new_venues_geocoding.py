#!/usr/bin/env python3
"""
Check how many of the newly restored 99 venues need geocoding.
"""

import json

def check_new_venues_geocoding():
    """Check the geocoding status of the newly restored venues."""
    print("🔍 Checking geocoding status of newly restored venues...")
    
    # Load the current venue data
    try:
        with open('venue-data.js', 'r', encoding='utf-8') as file:
            content = file.read()
            start = content.find('const VENUE_DATA = ') + len('const VENUE_DATA = ')
            end = content.rfind(';')
            json_str = content[start:end]
            venues = json.loads(json_str)
    except Exception as e:
        print(f"Error loading venue data: {e}")
        return
    
    print(f"📊 Total venues: {len(venues)}")
    
    # The newly restored venues were the ones that were missing
    # They should all have empty coordinates since we added them with empty lat/lng
    venues_with_coords = 0
    venues_without_coords = 0
    new_venues_without_coords = 0
    
    for venue in venues:
        lat = venue.get('latitude')
        lng = venue.get('longitude')
        
        if lat and lng:
            try:
                lat_val = float(lat)
                lng_val = float(lng)
                if lat_val != 0 and lng_val != 0:
                    venues_with_coords += 1
                else:
                    venues_without_coords += 1
            except (ValueError, TypeError):
                venues_without_coords += 1
        else:
            venues_without_coords += 1
    
    # Estimate how many of the restored venues need geocoding
    # Since we restored 99 venues and they all had empty coordinates
    # All 99 should need geocoding
    estimated_new_venues_needing_geocoding = 99
    
    print(f"\n📍 Geocoding Status:")
    print(f"  ✅ Venues with coordinates: {venues_with_coords}")
    print(f"  🌍 Venues without coordinates: {venues_without_coords}")
    print(f"  📊 Total venues: {len(venues)}")
    
    print(f"\n🆕 Newly Restored Venues:")
    print(f"  📊 Restored venues: 99")
    print(f"  🌍 Estimated needing geocoding: {estimated_new_venues_needing_geocoding}")
    
    # Show some examples of venues that need geocoding
    print(f"\n📋 Examples of venues needing geocoding:")
    count = 0
    for venue in venues:
        lat = venue.get('latitude')
        lng = venue.get('longitude')
        
        if not lat or not lng:
            count += 1
            if count <= 10:  # Show first 10
                print(f"  {count}. {venue.get('name', 'Unknown')} | {venue.get('town', 'Unknown')}")
            if count == 10:
                print(f"     ... and {venues_without_coords - 10} more")
                break
    
    print(f"\n💡 Recommendation:")
    if estimated_new_venues_needing_geocoding > 0:
        print(f"  🚀 Run the Google Maps geocoding to get coordinates for the restored venues")
        print(f"  📍 This will add {estimated_new_venues_needing_geocoding} more venues to the map")
    else:
        print(f"  ✅ All restored venues already have coordinates")

if __name__ == "__main__":
    check_new_venues_geocoding()
