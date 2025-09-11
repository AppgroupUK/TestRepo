#!/usr/bin/env python3
"""
Add latitude and longitude columns to the CSV file.
This will make the map load much faster since no geocoding is needed.
"""

import csv
import json

def add_coordinates_to_csv():
    venues = []
    
    # Read the original CSV
    with open('JW and Smirnoff Venues - Sheet1.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        fieldnames = reader.fieldnames + ['Latitude', 'Longitude']
        
        for row in reader:
            # For now, add placeholder coordinates
            # You can replace these with actual coordinates later
            row['Latitude'] = ''  # Will be filled with actual coordinates
            row['Longitude'] = ''  # Will be filled with actual coordinates
            venues.append(row)
    
    # Write the updated CSV
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(venues)
    
    print(f"✅ Created updated CSV with coordinate columns: JW and Smirnoff Venues - Sheet1_with_coords.csv")
    print(f"📊 Processed {len(venues)} venues")
    print(f"📍 Added Latitude and Longitude columns")
    print(f"\n💡 Next steps:")
    print(f"1. Open the new CSV file in Excel/Google Sheets")
    print(f"2. Fill in the actual latitude and longitude for each venue")
    print(f"3. Save the file")
    print(f"4. Run this script again to regenerate the venue data")

def create_sample_with_coords():
    """Create a sample with a few venues that have real coordinates for testing"""
    
    # Sample venues with real UK coordinates
    sample_venues = [
        {
            'OriginalOrder': '1',
            'Type': 'JW',
            'SheetName': 'Birmingham',
            'Name': 'Emerald Club | Wolverhampton',
            'Address1': 'Cross Street North',
            'Address2': '',
            'Town': 'Wolverhampton',
            'PostCode': 'WV1 1PP',
            'Country': 'UK',
            'Account Manager Name': 'Arjun Lal',
            'Account Manager Email': 'arjun.lal@diageotrade.co.uk',
            'Account Manager Number': '',
            'Phone Number': '7483366331',
            'Quantity': '1',
            'Latitude': '52.5869',
            'Longitude': '-2.1285'
        },
        {
            'OriginalOrder': '2',
            'Type': 'JW',
            'SheetName': 'Birmingham',
            'Name': 'Builders Arms | Wolverhampton',
            'Address1': '36 Derry Street',
            'Address2': '',
            'Town': 'Wolverhampton',
            'PostCode': 'WV2 1EY',
            'Country': 'UK',
            'Account Manager Name': 'Arjun Lal',
            'Account Manager Email': 'arjun.lal@diageotrade.co.uk',
            'Account Manager Number': '',
            'Phone Number': '7483366331',
            'Quantity': '1',
            'Latitude': '52.5869',
            'Longitude': '-2.1285'
        }
    ]
    
    # Write sample CSV
    fieldnames = list(sample_venues[0].keys())
    with open('sample_venues_with_coords.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sample_venues)
    
    print(f"✅ Created sample CSV with coordinates: sample_venues_with_coords.csv")

if __name__ == "__main__":
    print("🚀 Adding coordinate columns to CSV...")
    add_coordinates_to_csv()
    create_sample_with_coords()
