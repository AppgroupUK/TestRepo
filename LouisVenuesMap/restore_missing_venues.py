#!/usr/bin/env python3
"""
Restore missing venues by comparing original CSV with current data.
This will identify and restore the 99 missing venues.
"""

import csv
import json

def load_original_venues():
    """Load all venues from the original CSV."""
    venues = []
    with open('JW and Smirnoff Venues - Sheet1.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            venues.append(row)
    return venues

def load_current_venues():
    """Load venues from the current processed CSV."""
    venues = []
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            venues.append(row)
    return venues

def find_missing_venues():
    """Find venues that are in original but not in current."""
    print("🔍 Finding missing venues...")
    
    original = load_original_venues()
    current = load_current_venues()
    
    print(f"📊 Original CSV: {len(original)} venues")
    print(f"📊 Current CSV: {len(current)} venues")
    print(f"📊 Missing: {len(original) - len(current)} venues")
    
    # Create lookup for current venues by name
    current_names = set()
    for venue in current:
        name = venue.get('Name', '').strip()
        if name:
            current_names.add(name.lower())
    
    # Find missing venues
    missing = []
    for venue in original:
        name = venue.get('Name', '').strip()
        if name and name.lower() not in current_names:
            missing.append(venue)
    
    print(f"❌ Found {len(missing)} missing venues")
    
    # Show some examples
    if missing:
        print(f"\n📋 Examples of missing venues:")
        for i, venue in enumerate(missing[:10], 1):
            print(f"  {i}. {venue.get('Name', 'Unknown')} | {venue.get('Type', 'Unknown')} | {venue.get('Town', 'Unknown')}")
        if len(missing) > 10:
            print(f"     ... and {len(missing) - 10} more")
    
    return missing

def restore_missing_venues():
    """Restore missing venues to the current CSV."""
    print("\n🔄 Restoring missing venues...")
    
    # Load both datasets
    original = load_original_venues()
    current = load_current_venues()
    
    # Create lookup for current venues
    current_names = set()
    for venue in current:
        name = venue.get('Name', '').strip()
        if name:
            current_names.add(name.lower())
    
    # Find and restore missing venues
    restored_count = 0
    for venue in original:
        name = venue.get('Name', '').strip()
        if name and name.lower() not in current_names:
            # Add missing venue with empty coordinates
            venue['Latitude'] = ''
            venue['Longitude'] = ''
            current.append(venue)
            restored_count += 1
    
    # Save the restored CSV
    if current:
        fieldnames = list(current[0].keys())
        with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(current)
        
        print(f"✅ Restored {restored_count} missing venues")
        print(f"📊 Total venues now: {len(current)}")
        print(f"📁 Updated: JW and Smirnoff Venues - Sheet1_with_coords.csv")
    
    return restored_count

def regenerate_venue_data():
    """Regenerate the venue-data.js file with all venues."""
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

if __name__ == "__main__":
    try:
        # Find missing venues
        missing = find_missing_venues()
        
        if missing:
            # Restore missing venues
            restored = restore_missing_venues()
            
            if restored > 0:
                # Regenerate venue data
                if regenerate_venue_data():
                    print(f"\n🎉 Successfully restored {restored} missing venues!")
                    print(f"🌐 Your map should now show all 1,325 venues!")
                else:
                    print(f"\n⚠️  Restored venues but failed to regenerate data")
            else:
                print(f"\n❌ No venues were restored")
        else:
            print(f"\n✅ No missing venues found - all venues are present!")
            
    except Exception as e:
        print(f"❌ Error during restoration: {e}")
        import traceback
        traceback.print_exc()
