#!/usr/bin/env python3
"""
Restore the exact 99 missing venues identified in the analysis.
"""

import csv
import json

def restore_missing_venues():
    """Restore the 99 missing venues to the processed CSV."""
    print("🔄 Restoring 99 missing venues...")
    
    # Load original CSV
    original_venues = []
    with open('JW and Smirnoff Venues - Sheet1.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row.get('OriginalOrder'):  # Only process rows with OriginalOrder
                original_venues.append(row)
    
    # Load processed CSV
    processed_venues = []
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row.get('OriginalOrder'):  # Only process rows with OriginalOrder
                processed_venues.append(row)
    
    print(f"📊 Original venues: {len(original_venues)}")
    print(f"📊 Processed venues: {len(processed_venues)}")
    
    # Create lookup for processed venues
    processed_orders = {int(v['OriginalOrder']) for v in processed_venues}
    
    # Find missing venues
    missing_venues = []
    for venue in original_venues:
        order = int(venue['OriginalOrder'])
        if order not in processed_orders:
            # Add missing venue with empty coordinates
            venue['Latitude'] = ''
            venue['Longitude'] = ''
            missing_venues.append(venue)
    
    print(f"❌ Found {len(missing_venues)} missing venues")
    
    # Add missing venues to processed data
    all_venues = processed_venues + missing_venues
    
    # Sort by OriginalOrder to maintain order
    all_venues.sort(key=lambda x: int(x['OriginalOrder']))
    
    # Save the complete CSV
    if all_venues:
        fieldnames = list(all_venues[0].keys())
        with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_venues)
        
        print(f"✅ Restored {len(missing_venues)} missing venues")
        print(f"📊 Total venues now: {len(all_venues)}")
        print(f"📁 Updated: JW and Smirnoff Venues - Sheet1_with_coords.csv")
    
    return len(missing_venues)

def regenerate_venue_data():
    """Regenerate the venue-data.js file."""
    print("\n🔄 Regenerating venue data...")
    
    import subprocess
    result = subprocess.run(['python3', 'regenerate_data.py'], capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Venue data regenerated successfully!")
        return True
    else:
        print("❌ Error regenerating venue data:")
        print(result.stderr)
        return False

def verify_restoration():
    """Verify that all venues have been restored."""
    print("\n🔍 Verifying restoration...")
    
    # Check venue-data.js
    try:
        with open('venue-data.js', 'r', encoding='utf-8') as file:
            content = file.read()
            start = content.find('const VENUE_DATA = ') + len('const VENUE_DATA = ')
            end = content.rfind(';')
            json_str = content[start:end]
            js_venues = json.loads(json_str)
        
        print(f"📊 Venues in venue-data.js: {len(js_venues)}")
        
        # Count venues with and without coordinates
        with_coords = sum(1 for v in js_venues if v.get('latitude') and v.get('longitude'))
        without_coords = len(js_venues) - with_coords
        
        print(f"📍 Venues with coordinates: {with_coords}")
        print(f"🌍 Venues without coordinates: {without_coords}")
        
        if len(js_venues) == 1325:
            print("✅ All 1,325 venues restored successfully!")
        else:
            print(f"⚠️  Expected 1,325 venues, found {len(js_venues)}")
            
    except Exception as e:
        print(f"❌ Error verifying restoration: {e}")

if __name__ == "__main__":
    try:
        # Restore missing venues
        restored_count = restore_missing_venues()
        
        if restored_count > 0:
            # Regenerate venue data
            if regenerate_venue_data():
                # Verify restoration
                verify_restoration()
            else:
                print("❌ Failed to regenerate venue data")
        else:
            print("✅ No venues needed restoration")
            
    except Exception as e:
        print(f"❌ Error during restoration: {e}")
        import traceback
        traceback.print_exc()
