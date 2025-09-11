#!/usr/bin/env python3
"""
Regenerate venue-data.js from the CSV file with coordinate support.
This script will use the CSV file with coordinates if available, otherwise fall back to the original.
"""

import csv
import json
import os

def regenerate_venue_data():
    csv_file = None
    
    # Try to find the CSV file with coordinates first
    if os.path.exists('JW and Smirnoff Venues - Sheet1_with_coords.csv'):
        csv_file = 'JW and Smirnoff Venues - Sheet1_with_coords.csv'
        print("📁 Using CSV file with coordinates")
    elif os.path.exists('JW and Smirnoff Venues - Sheet1.csv'):
        csv_file = 'JW and Smirnoff Venues - Sheet1.csv'
        print("📁 Using original CSV file (no coordinates)")
    else:
        print("❌ No CSV file found!")
        return
    
    venues = []
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for index, row in enumerate(reader):
            # Clean up the data
            venue = {
                'id': index,
                'name': row.get('Name', '').strip() or 'Unknown Venue',
                'address1': row.get('Address1', '').strip(),
                'address2': row.get('Address2', '').strip(),
                'town': row.get('Town', '').strip(),
                'postCode': row.get('PostCode', '').strip(),
                'country': row.get('Country', '').strip() or 'UK',
                'type': row.get('Type', '').strip() or 'Unknown',
                'accountManager': row.get('Account Manager Name', '').strip(),
                'accountManagerEmail': row.get('Account Manager Email', '').strip(),
                'phone': row.get('Phone Number', '').strip(),
                'quantity': row.get('Quantity', '').strip() or '1'
            }
            
            # Add coordinates if available
            if 'Latitude' in row and 'Longitude' in row:
                lat = row.get('Latitude', '').strip()
                lng = row.get('Longitude', '').strip()
                if lat and lng:
                    try:
                        venue['latitude'] = float(lat)
                        venue['longitude'] = float(lng)
                    except ValueError:
                        print(f"⚠️  Invalid coordinates for {venue['name']}: {lat}, {lng}")
            
            # Build full address
            address_parts = [
                venue['address1'],
                venue['address2'],
                venue['town'],
                venue['postCode'],
                venue['country']
            ]
            venue['fullAddress'] = ', '.join([part for part in address_parts if part])
            
            venues.append(venue)
    
    # Count venues with coordinates
    venues_with_coords = sum(1 for v in venues if 'latitude' in v and 'longitude' in v)
    
    # Generate JavaScript code
    js_code = f"""
// Venue data embedded from CSV
// {venues_with_coords} venues have coordinates, {len(venues) - venues_with_coords} need geocoding
const VENUE_DATA = {json.dumps(venues, indent=2)};
"""
    
    # Write to JavaScript file
    with open('venue-data.js', 'w', encoding='utf-8') as f:
        f.write(js_code)
    
    print(f"✅ Successfully regenerated venue-data.js!")
    print(f"📊 Processed {len(venues)} venues")
    print(f"📍 {venues_with_coords} venues have coordinates")
    print(f"🌍 {len(venues) - venues_with_coords} venues need geocoding")
    print(f"📁 Updated venue-data.js")

if __name__ == "__main__":
    regenerate_venue_data()
