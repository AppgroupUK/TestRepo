#!/usr/bin/env python3
"""
Clean up incorrect coordinates that are outside the UK.
Remove coordinates that are clearly in other countries.
"""

import csv
import json

def is_coordinate_in_uk(lat, lng):
    """
    Check if coordinates are within the UK bounding box.
    UK approximate bounds:
    - Latitude: 49.8 to 60.9 (Shetland Islands)
    - Longitude: -8.2 to 1.8 (Northern Ireland to East Anglia)
    """
    try:
        lat = float(lat)
        lng = float(lng)
        
        # UK bounding box
        uk_lat_min = 49.8
        uk_lat_max = 60.9
        uk_lng_min = -8.2
        uk_lng_max = 1.8
        
        return (uk_lat_min <= lat <= uk_lat_max and 
                uk_lng_min <= lng <= uk_lng_max)
    except (ValueError, TypeError):
        return False

def clean_coordinates():
    """
    Clean the CSV file by removing coordinates that are outside the UK.
    """
    print("🧹 Cleaning coordinates outside the UK...")
    
    # Read the CSV with coordinates
    venues = []
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        fieldnames = reader.fieldnames
        
        for row in reader:
            # Check if coordinates exist and are valid
            lat = row.get('Latitude', '').strip()
            lng = row.get('Longitude', '').strip()
            
            if lat and lng:
                if is_coordinate_in_uk(lat, lng):
                    # Coordinates are in UK - keep them
                    venues.append(row)
                else:
                    # Coordinates are outside UK - remove them
                    print(f"❌ Removing coordinates for {row.get('Name', 'Unknown')}: {lat}, {lng}")
                    row['Latitude'] = ''
                    row['Longitude'] = ''
                    venues.append(row)
            else:
                # No coordinates - keep as is
                venues.append(row)
    
    # Save the cleaned CSV
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(venues)
    
    # Count results
    total_venues = len(venues)
    venues_with_coords = sum(1 for v in venues if v.get('Latitude') and v.get('Longitude'))
    venues_without_coords = total_venues - venues_with_coords
    
    print(f"✅ Coordinate cleaning complete!")
    print(f"📊 Total venues: {total_venues}")
    print(f"📍 Venues with valid UK coordinates: {venues_with_coords}")
    print(f"🌍 Venues without coordinates: {venues_without_coords}")
    print(f"📁 Updated: JW and Smirnoff Venues - Sheet1_with_coords.csv")
    
    return venues_with_coords, venues_without_coords

def show_problematic_coordinates():
    """
    Show examples of coordinates that were removed.
    """
    print("\n🔍 Checking for problematic coordinates...")
    
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        problematic_count = 0
        for row in reader:
            lat = row.get('Latitude', '').strip()
            lng = row.get('Longitude', '').strip()
            
            if lat and lng:
                if not is_coordinate_in_uk(lat, lng):
                    problematic_count += 1
                    if problematic_count <= 10:  # Show first 10 examples
                        print(f"  - {row.get('Name', 'Unknown')}: {lat}, {lng}")
        
        if problematic_count > 10:
            print(f"  ... and {problematic_count - 10} more")
        
        print(f"Found {problematic_count} venues with coordinates outside UK")

if __name__ == "__main__":
    # First show what we're about to clean
    show_problematic_coordinates()
    
    # Clean the coordinates
    coords_count, no_coords_count = clean_coordinates()
    
    print(f"\n🔄 Regenerating venue data...")
    import subprocess
    result = subprocess.run(['python3', 'regenerate_data.py'], capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Venue data regenerated successfully!")
        print("🌐 Your map will now only show venues with correct UK coordinates!")
    else:
        print("⚠️  Error regenerating venue data:")
        print(result.stderr)

