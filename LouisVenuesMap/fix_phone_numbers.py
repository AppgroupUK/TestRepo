#!/usr/bin/env python3
"""
Fix phone numbers to ensure they all begin with '0' (UK format).
"""

import csv
import re

def fix_phone_number(phone):
    """
    Fix a phone number to ensure it starts with '0'.
    Handles various formats and removes non-numeric characters.
    """
    if not phone or not phone.strip():
        return phone
    
    # Remove all non-numeric characters
    cleaned = re.sub(r'[^\d]', '', phone.strip())
    
    # If empty after cleaning, return original
    if not cleaned:
        return phone
    
    # If it starts with '0', return as is
    if cleaned.startswith('0'):
        return cleaned
    
    # If it starts with '44' (UK country code), replace with '0'
    if cleaned.startswith('44'):
        return '0' + cleaned[2:]
    
    # If it starts with '+44', replace with '0'
    if cleaned.startswith('+44'):
        return '0' + cleaned[3:]
    
    # If it's a valid UK mobile number (11 digits starting with 7), add '0'
    if len(cleaned) == 10 and cleaned.startswith('7'):
        return '0' + cleaned
    
    # If it's a valid UK landline (10 digits), add '0'
    if len(cleaned) == 10:
        return '0' + cleaned
    
    # If it's already 11 digits and doesn't start with '0', add '0'
    if len(cleaned) == 11 and not cleaned.startswith('0'):
        return '0' + cleaned
    
    # For other cases, just add '0' if it doesn't start with '0'
    if not cleaned.startswith('0'):
        return '0' + cleaned
    
    return cleaned

def fix_phone_numbers_in_csv():
    """Fix phone numbers in the CSV file."""
    print("📞 Fixing phone numbers to ensure they start with '0'...")
    
    # Read the CSV
    venues = []
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        fieldnames = reader.fieldnames
        
        for row in reader:
            # Fix the phone number
            original_phone = row.get('Phone Number', '').strip()
            fixed_phone = fix_phone_number(original_phone)
            row['Phone Number'] = fixed_phone
            venues.append(row)
    
    # Save the updated CSV
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(venues)
    
    print(f"✅ Phone numbers fixed and saved to CSV")
    return len(venues)

def analyze_phone_numbers():
    """Analyze phone number formats before and after fixing."""
    print("\n🔍 Analyzing phone number formats...")
    
    # Count different phone number patterns
    patterns = {
        'starts_with_0': 0,
        'starts_with_44': 0,
        'starts_with_+44': 0,
        'starts_with_7': 0,
        'empty': 0,
        'other': 0
    }
    
    with open('JW and Smirnoff Venues - Sheet1_with_coords.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            phone = row.get('Phone Number', '').strip()
            
            if not phone:
                patterns['empty'] += 1
            elif phone.startswith('0'):
                patterns['starts_with_0'] += 1
            elif phone.startswith('44'):
                patterns['starts_with_44'] += 1
            elif phone.startswith('+44'):
                patterns['starts_with_+44'] += 1
            elif phone.startswith('7'):
                patterns['starts_with_7'] += 1
            else:
                patterns['other'] += 1
    
    print(f"📊 Phone number analysis:")
    print(f"  ✅ Starts with '0': {patterns['starts_with_0']}")
    print(f"  🇬🇧 Starts with '44': {patterns['starts_with_44']}")
    print(f"  🌍 Starts with '+44': {patterns['starts_with_+44']}")
    print(f"  📱 Starts with '7': {patterns['starts_with_7']}")
    print(f"  ❌ Empty: {patterns['empty']}")
    print(f"  ❓ Other: {patterns['other']}")
    
    return patterns

def regenerate_venue_data():
    """Regenerate the venue-data.js file with fixed phone numbers."""
    print("\n🔄 Regenerating venue data with fixed phone numbers...")
    
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
        # Analyze phone numbers before fixing
        print("🔍 Analyzing phone numbers before fixing...")
        before_patterns = analyze_phone_numbers()
        
        # Fix phone numbers
        venue_count = fix_phone_numbers_in_csv()
        
        # Analyze phone numbers after fixing
        print("\n🔍 Analyzing phone numbers after fixing...")
        after_patterns = analyze_phone_numbers()
        
        # Regenerate venue data
        if regenerate_venue_data():
            print(f"\n🎉 Phone number standardization complete!")
            print(f"📊 Processed {venue_count} venues")
            print(f"✅ All phone numbers now start with '0' (UK format)")
        else:
            print(f"\n⚠️  Phone numbers fixed but failed to regenerate venue data")
            
    except Exception as e:
        print(f"❌ Error during phone number fixing: {e}")
        import traceback
        traceback.print_exc()


