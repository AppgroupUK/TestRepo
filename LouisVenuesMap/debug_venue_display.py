#!/usr/bin/env python3
"""
Debug why the map shows fewer venues than expected.
Analyze the venue data and filtering logic.
"""

import json

def analyze_venue_data():
    """Analyze the current venue data in detail."""
    print("🔍 Detailed Venue Data Analysis")
    print("=" * 50)
    
    # Load current venue data
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
    
    print(f"📊 Total venues in data: {len(venues)}")
    
    # Analyze venue types
    venue_types = {}
    for venue in venues:
        venue_type = venue.get('type', 'Unknown')
        venue_types[venue_type] = venue_types.get(venue_type, 0) + 1
    
    print(f"\n📋 Venue Types:")
    for venue_type, count in sorted(venue_types.items()):
        print(f"  {venue_type}: {count}")
    
    # Analyze coordinates
    with_coords = 0
    without_coords = 0
    invalid_coords = 0
    
    for venue in venues:
        lat = venue.get('latitude')
        lng = venue.get('longitude')
        
        if lat and lng:
            try:
                lat_val = float(lat)
                lng_val = float(lng)
                if lat_val != 0 and lng_val != 0:  # Exclude 0,0 coordinates
                    with_coords += 1
                else:
                    invalid_coords += 1
            except (ValueError, TypeError):
                invalid_coords += 1
        else:
            without_coords += 1
    
    print(f"\n📍 Coordinate Analysis:")
    print(f"  ✅ Valid coordinates: {with_coords}")
    print(f"  ❌ No coordinates: {without_coords}")
    print(f"  ⚠️  Invalid coordinates: {invalid_coords}")
    
    # Analyze addresses
    no_address = 0
    partial_address = 0
    full_address = 0
    
    for venue in venues:
        name = venue.get('name', '').strip()
        address1 = venue.get('address1', '').strip()
        town = venue.get('town', '').strip()
        postcode = venue.get('postcode', '').strip()
        
        if not name:
            no_address += 1
        elif not address1 and not town and not postcode:
            no_address += 1
        elif address1 and town and postcode:
            full_address += 1
        else:
            partial_address += 1
    
    print(f"\n🏠 Address Analysis:")
    print(f"  ✅ Full address: {full_address}")
    print(f"  ⚠️  Partial address: {partial_address}")
    print(f"  ❌ No address: {no_address}")
    
    # Check for potential filtering issues
    print(f"\n🔍 Potential Map Display Issues:")
    
    # Check if venues are being filtered by type
    jw_venues = sum(1 for v in venues if v.get('type') == 'JW')
    smirnoff_venues = sum(1 for v in venues if v.get('type') == 'Smirnoff')
    unknown_venues = sum(1 for v in venues if v.get('type') not in ['JW', 'Smirnoff'])
    
    print(f"  JW venues: {jw_venues}")
    print(f"  Smirnoff venues: {smirnoff_venues}")
    print(f"  Unknown/Other venues: {unknown_venues}")
    
    # Check for venues that might be filtered out
    filtered_venues = []
    for venue in venues:
        name = venue.get('name', '').strip()
        if not name or name.lower() in ['unknown venue', 'n/a', '']:
            filtered_venues.append(venue)
    
    if filtered_venues:
        print(f"\n⚠️  Venues that might be filtered out ({len(filtered_venues)}):")
        for i, venue in enumerate(filtered_venues[:10], 1):
            print(f"  {i}. Name: '{venue.get('name', '')}' | Type: {venue.get('type', '')}")
        if len(filtered_venues) > 10:
            print(f"     ... and {len(filtered_venues) - 10} more")
    
    return {
        'total_venues': len(venues),
        'with_coords': with_coords,
        'without_coords': without_coords,
        'jw_venues': jw_venues,
        'smirnoff_venues': smirnoff_venues,
        'unknown_venues': unknown_venues,
        'filtered_venues': len(filtered_venues)
    }

def check_map_filtering():
    """Check if the map might be filtering venues."""
    print(f"\n🗺️  Map Filtering Analysis:")
    print("=" * 30)
    
    print("The map might be filtering venues based on:")
    print("1. 🔍 Search filter - if you have text in the search box")
    print("2. 🏷️  Type filter - if you've selected JW or Smirnoff only")
    print("3. 🌍 Country filter - if you've selected a specific country")
    print("4. 📍 Coordinate filter - venues without coordinates might not show")
    
    print(f"\n💡 To see all venues on the map:")
    print("1. Clear any search text")
    print("2. Set Type filter to 'All Types'")
    print("3. Set Country filter to 'All Countries'")
    print("4. Check if venues without coordinates are being hidden")

if __name__ == "__main__":
    try:
        stats = analyze_venue_data()
        check_map_filtering()
        
        print(f"\n✅ Analysis complete!")
        print(f"📊 Expected venues on map: {stats['total_venues']}")
        print(f"📍 Venues with coordinates: {stats['with_coords']}")
        print(f"🌍 Venues without coordinates: {stats['without_coords']}")
        
        if stats['without_coords'] > 0:
            print(f"\n⚠️  Note: {stats['without_coords']} venues don't have coordinates")
            print("   These might not appear on the map until geocoded")
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()
