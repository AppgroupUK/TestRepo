#!/usr/bin/env python3
"""
Precise analysis of venue data to understand the discrepancy.
"""

import csv
import json

def analyze_csv_files():
    """Analyze both CSV files precisely."""
    print("🔍 Precise CSV Analysis")
    print("=" * 40)
    
    # Analyze original CSV
    original_venues = []
    with open('JW and Smirnoff Venues - Sheet1.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for i, row in enumerate(reader, 1):
            if row.get('OriginalOrder'):  # Only count rows with OriginalOrder
                original_venues.append({
                    'order': row.get('OriginalOrder'),
                    'name': row.get('Name', '').strip(),
                    'type': row.get('Type', '').strip()
                })
    
    print(f"📊 Original CSV data rows: {len(original_venues)}")
    print(f"📊 OriginalOrder range: {min(int(v['order']) for v in original_venues)} to {max(int(v['order']) for v in original_venues)}")
    
    # Analyze processed CSV
    processed_venues = []
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row.get('OriginalOrder'):  # Only count rows with OriginalOrder
                processed_venues.append({
                    'order': row.get('OriginalOrder'),
                    'name': row.get('Name', '').strip(),
                    'type': row.get('Type', '').strip()
                })
    
    print(f"📊 Processed CSV data rows: {len(processed_venues)}")
    print(f"📊 OriginalOrder range: {min(int(v['order']) for v in processed_venues)} to {max(int(v['order']) for v in processed_venues)}")
    
    # Analyze venue-data.js
    try:
        with open('venue-data.js', 'r', encoding='utf-8') as file:
            content = file.read()
            start = content.find('const VENUE_DATA = ') + len('const VENUE_DATA = ')
            end = content.rfind(';')
            json_str = content[start:end]
            js_venues = json.loads(json_str)
        
        print(f"📊 venue-data.js venues: {len(js_venues)}")
    except Exception as e:
        print(f"❌ Error reading venue-data.js: {e}")
        js_venues = []
    
    # Find missing venues
    original_orders = {int(v['order']) for v in original_venues}
    processed_orders = {int(v['order']) for v in processed_venues}
    missing_orders = original_orders - processed_orders
    
    print(f"\n❌ Missing OriginalOrder values: {len(missing_orders)}")
    if missing_orders:
        missing_list = sorted(list(missing_orders))
        print(f"📋 Missing orders: {missing_list[:20]}{'...' if len(missing_list) > 20 else ''}")
        
        # Show details of missing venues
        print(f"\n📋 Details of missing venues:")
        for venue in original_venues:
            if int(venue['order']) in missing_orders:
                print(f"  Order {venue['order']}: {venue['name']} ({venue['type']})")
    
    return len(missing_orders), missing_orders

def check_data_processing():
    """Check what might have caused data loss during processing."""
    print(f"\n🔍 Data Processing Analysis")
    print("=" * 30)
    
    # Check for empty rows in original CSV
    empty_rows = 0
    with open('JW and Smirnoff Venues - Sheet1.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for i, row in enumerate(reader, 1):
            if not any(row.values()):  # Completely empty row
                empty_rows += 1
            elif not row.get('OriginalOrder'):  # Row without OriginalOrder
                print(f"  Row {i+1}: Missing OriginalOrder")
    
    print(f"📊 Empty rows in original CSV: {empty_rows}")
    
    # Check for potential parsing issues
    print(f"\n💡 Potential causes of missing venues:")
    print(f"1. Empty rows in original CSV")
    print(f"2. Rows without OriginalOrder values")
    print(f"3. Data processing errors during coordinate cleaning")
    print(f"4. CSV parsing issues with special characters")
    print(f"5. Duplicate removal during processing")

if __name__ == "__main__":
    try:
        missing_count, missing_orders = analyze_csv_files()
        check_data_processing()
        
        print(f"\n✅ Analysis complete!")
        print(f"📊 Missing venues: {missing_count}")
        
        if missing_count > 0:
            print(f"\n🔧 To fix this issue:")
            print(f"1. Check the original CSV for empty rows")
            print(f"2. Re-run the coordinate cleaning process")
            print(f"3. Verify all venues are being processed correctly")
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()
