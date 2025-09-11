#!/usr/bin/env python3
"""
Find venues that were in the original CSV but are missing from the current map.
This will help identify what happened to the missing 99 venues.
"""

import csv
import json

def load_original_venues():
    """Load venues from the original CSV file."""
    venues = []
    with open('JW and Smirnoff Venues - Sheet1.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            venues.append({
                'name': row.get('Name', '').strip(),
                'address1': row.get('Address1', '').strip(),
                'address2': row.get('Address2', '').strip(),
                'town': row.get('Town', '').strip(),
                'postcode': row.get('PostCode', '').strip(),
                'country': row.get('Country', '').strip(),
                'type': row.get('Type', '').strip(),
                'original_order': row.get('OriginalOrder', '').strip()
            })
    return venues

def load_current_venues():
    """Load venues from the current venue-data.js file."""
    try:
        with open('venue-data.js', 'r', encoding='utf-8') as file:
            content = file.read()
            # Extract the VENUE_DATA array from the JavaScript file
            start = content.find('const VENUE_DATA = ') + len('const VENUE_DATA = ')
            end = content.rfind(';')
            json_str = content[start:end]
            venues = json.loads(json_str)
            return venues
    except Exception as e:
        print(f"Error loading current venues: {e}")
        return []

def find_missing_venues():
    """Compare original and current venues to find missing ones."""
    print("🔍 Analyzing venue data...")
    
    # Load both datasets
    original_venues = load_original_venues()
    current_venues = load_current_venues()
    
    print(f"📊 Original CSV: {len(original_venues)} venues")
    print(f"📊 Current map: {len(current_venues)} venues")
    print(f"📊 Difference: {len(original_venues) - len(current_venues)} venues")
    
    # Create lookup for current venues
    current_venue_names = set()
    for venue in current_venues:
        name = venue.get('name', '').strip()
        if name:
            current_venue_names.add(name.lower())
    
    # Find missing venues
    missing_venues = []
    for venue in original_venues:
        name = venue.get('name', '').strip()
        if name and name.lower() not in current_venue_names:
            missing_venues.append(venue)
    
    print(f"\n❌ Found {len(missing_venues)} missing venues:")
    print("=" * 80)
    
    # Categorize missing venues
    no_address = []
    empty_name = []
    other_reasons = []
    
    for venue in missing_venues:
        name = venue.get('name', '').strip()
        address1 = venue.get('address1', '').strip()
        town = venue.get('town', '').strip()
        postcode = venue.get('postcode', '').strip()
        
        if not name:
            empty_name.append(venue)
        elif not address1 and not town and not postcode:
            no_address.append(venue)
        else:
            other_reasons.append(venue)
    
    # Report by category
    print(f"\n📋 Missing Venues by Category:")
    print(f"  🏷️  Empty/No Name: {len(empty_name)}")
    print(f"  📍 No Address Info: {len(no_address)}")
    print(f"  ❓ Other Reasons: {len(other_reasons)}")
    
    # Show details
    if empty_name:
        print(f"\n🏷️  VENUES WITH EMPTY NAMES ({len(empty_name)}):")
        for i, venue in enumerate(empty_name[:10], 1):  # Show first 10
            print(f"  {i}. Order: {venue.get('original_order', 'N/A')} | Type: {venue.get('type', 'N/A')}")
            print(f"     Address: {venue.get('address1', '')} {venue.get('town', '')} {venue.get('postcode', '')}")
        if len(empty_name) > 10:
            print(f"     ... and {len(empty_name) - 10} more")
    
    if no_address:
        print(f"\n📍 VENUES WITH NO ADDRESS INFO ({len(no_address)}):")
        for i, venue in enumerate(no_address[:10], 1):  # Show first 10
            print(f"  {i}. {venue.get('name', 'Unknown')} | Order: {venue.get('original_order', 'N/A')}")
            print(f"     Type: {venue.get('type', 'N/A')} | Country: {venue.get('country', 'N/A')}")
        if len(no_address) > 10:
            print(f"     ... and {len(no_address) - 10} more")
    
    if other_reasons:
        print(f"\n❓ OTHER MISSING VENUES ({len(other_reasons)}):")
        for i, venue in enumerate(other_reasons[:10], 1):  # Show first 10
            print(f"  {i}. {venue.get('name', 'Unknown')} | Order: {venue.get('original_order', 'N/A')}")
            print(f"     Address: {venue.get('address1', '')} {venue.get('town', '')} {venue.get('postcode', '')}")
            print(f"     Type: {venue.get('type', 'N/A')}")
        if len(other_reasons) > 10:
            print(f"     ... and {len(other_reasons) - 10} more")
    
    # Save detailed report
    report = {
        'summary': {
            'original_count': len(original_venues),
            'current_count': len(current_venues),
            'missing_count': len(missing_venues),
            'empty_names': len(empty_name),
            'no_address': len(no_address),
            'other_reasons': len(other_reasons)
        },
        'missing_venues': missing_venues
    }
    
    with open('missing_venues_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed report saved to: missing_venues_report.json")
    
    return missing_venues

def analyze_venue_processing():
    """Analyze what might have caused venues to be missing."""
    print(f"\n🔍 ANALYSIS OF MISSING VENUES:")
    print("=" * 50)
    
    # Load the current venue data to see what we have
    current_venues = load_current_venues()
    
    # Count venues with and without coordinates
    with_coords = sum(1 for v in current_venues if v.get('latitude') and v.get('longitude'))
    without_coords = len(current_venues) - with_coords
    
    print(f"📍 Current venues with coordinates: {with_coords}")
    print(f"🌍 Current venues without coordinates: {without_coords}")
    print(f"📊 Total current venues: {len(current_venues)}")
    
    # Check for potential data processing issues
    print(f"\n🔍 POTENTIAL ISSUES:")
    print("1. Empty venue names might have been filtered out during processing")
    print("2. Venues with no address info might have been skipped")
    print("3. Duplicate venue names might have been merged")
    print("4. Data parsing errors might have occurred")
    
    print(f"\n💡 RECOMMENDATIONS:")
    print("1. Check the original CSV for empty rows or malformed data")
    print("2. Verify that all venue names are properly captured")
    print("3. Consider adding venues with partial address information")
    print("4. Review the data processing logic for any filtering issues")

if __name__ == "__main__":
    try:
        missing_venues = find_missing_venues()
        analyze_venue_processing()
        
        print(f"\n✅ Analysis complete!")
        print(f"📊 Found {len(missing_venues)} missing venues out of 1,325 original")
        print(f"📈 Current map shows {1325 - len(missing_venues)} venues")
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()
