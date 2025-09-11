#!/usr/bin/env python3
"""
Add county information to venue data based on UK postcodes.
This script uses postcode patterns to determine the county for each venue.
"""

import csv
import json
import re
import os

# UK Postcode to County mapping based on postcode areas
POSTCODE_TO_COUNTY = {
    # England
    'AB': 'Aberdeenshire', 'AL': 'Hertfordshire', 'B': 'West Midlands', 'BA': 'Somerset', 'BB': 'Lancashire',
    'BD': 'West Yorkshire', 'BH': 'Dorset', 'BL': 'Greater Manchester', 'BN': 'East Sussex', 'BR': 'Greater London',
    'BS': 'Bristol', 'BT': 'Northern Ireland', 'CA': 'Cumbria', 'CB': 'Cambridgeshire', 'CF': 'Cardiff',
    'CH': 'Cheshire', 'CM': 'Essex', 'CO': 'Essex', 'CR': 'Greater London', 'CT': 'Kent', 'CV': 'Warwickshire',
    'CW': 'Cheshire', 'DA': 'Kent', 'DD': 'Dundee', 'DE': 'Derbyshire', 'DG': 'Dumfries and Galloway',
    'DH': 'County Durham', 'DL': 'County Durham', 'DN': 'South Yorkshire', 'DT': 'Dorset',
    'E': 'Greater London', 'EC': 'Greater London', 'EH': 'Edinburgh', 'EN': 'Hertfordshire', 'EX': 'Devon',
    'FK': 'Falkirk', 'FY': 'Lancashire', 'G': 'Glasgow', 'GL': 'Gloucestershire', 'GU': 'Surrey',
    'GY': 'Guernsey', 'HA': 'Greater London', 'HD': 'West Yorkshire', 'HG': 'North Yorkshire', 'HP': 'Hertfordshire',
    'HR': 'Herefordshire', 'HS': 'Outer Hebrides', 'HU': 'East Yorkshire', 'HX': 'West Yorkshire', 'IG': 'Essex',
    'IP': 'Suffolk', 'IV': 'Highland', 'JE': 'Jersey', 'KA': 'East Ayrshire', 'KT': 'Surrey', 'KW': 'Highland',
    'KY': 'Fife', 'L': 'Merseyside', 'LA': 'Lancashire', 'LD': 'Powys', 'LE': 'Leicestershire', 'LL': 'Clwyd',
    'LN': 'Lincolnshire', 'LS': 'West Yorkshire', 'LU': 'Bedfordshire', 'M': 'Greater Manchester', 'ME': 'Kent',
    'MK': 'Buckinghamshire', 'ML': 'North Lanarkshire', 'N': 'Greater London', 'NE': 'Tyne and Wear',
    'NG': 'Nottinghamshire', 'NN': 'Northamptonshire', 'NP': 'Gwent', 'NR': 'Norfolk', 'NW': 'Greater London',
    'OL': 'Greater Manchester', 'OX': 'Oxfordshire', 'PA': 'Renfrewshire', 'PE': 'Cambridgeshire', 'PH': 'Perth and Kinross',
    'PL': 'Devon', 'PO': 'Hampshire', 'PR': 'Lancashire', 'RG': 'Berkshire', 'RH': 'Surrey', 'RM': 'Essex',
    'S': 'South Yorkshire', 'SA': 'West Glamorgan', 'SE': 'Greater London', 'SG': 'Hertfordshire', 'SK': 'Greater Manchester',
    'SL': 'Buckinghamshire', 'SM': 'Greater London', 'SN': 'Wiltshire', 'SO': 'Hampshire', 'SP': 'Wiltshire',
    'SR': 'Tyne and Wear', 'SS': 'Essex', 'ST': 'Staffordshire', 'SW': 'Greater London', 'SY': 'Shropshire',
    'TA': 'Somerset', 'TD': 'Borders', 'TF': 'Shropshire', 'TN': 'Kent', 'TQ': 'Devon', 'TR': 'Cornwall',
    'TS': 'Cleveland', 'TW': 'Greater London', 'UB': 'Greater London', 'W': 'Greater London', 'WA': 'Cheshire',
    'WC': 'Greater London', 'WD': 'Hertfordshire', 'WF': 'West Yorkshire', 'WN': 'Greater Manchester', 'WR': 'Worcestershire',
    'WS': 'Staffordshire', 'WV': 'West Midlands', 'YO': 'North Yorkshire', 'ZE': 'Shetland Islands',
    
    # Specific DY postcode districts (split between counties)
    'DY1': 'West Midlands',  # Dudley
    'DY2': 'West Midlands',  # Dudley
    'DY3': 'West Midlands',  # Dudley
    'DY4': 'West Midlands',  # Tipton
    'DY5': 'West Midlands',  # Dudley
    'DY6': 'West Midlands',  # Kingswinford
    'DY7': 'West Midlands',  # Stourbridge
    'DY8': 'West Midlands',  # Stourbridge
    'DY9': 'Worcestershire', # Stourbridge
    'DY10': 'Worcestershire', # Kidderminster
    'DY11': 'Worcestershire', # Kidderminster
    'DY12': 'Worcestershire', # Bewdley
    'DY13': 'Worcestershire', # Stourport-on-Severn
    'DY14': 'Worcestershire', # Tenbury Wells
    
    # Additional patterns for specific areas
    'SW1': 'Greater London', 'SW2': 'Greater London', 'SW3': 'Greater London', 'SW4': 'Greater London',
    'SW5': 'Greater London', 'SW6': 'Greater London', 'SW7': 'Greater London', 'SW8': 'Greater London',
    'SW9': 'Greater London', 'SW10': 'Greater London', 'SW11': 'Greater London', 'SW12': 'Greater London',
    'SW13': 'Greater London', 'SW14': 'Greater London', 'SW15': 'Greater London', 'SW16': 'Greater London',
    'SW17': 'Greater London', 'SW18': 'Greater London', 'SW19': 'Greater London', 'SW20': 'Greater London',
    'E1': 'Greater London', 'E2': 'Greater London', 'E3': 'Greater London', 'E4': 'Greater London',
    'E5': 'Greater London', 'E6': 'Greater London', 'E7': 'Greater London', 'E8': 'Greater London',
    'E9': 'Greater London', 'E10': 'Greater London', 'E11': 'Greater London', 'E12': 'Greater London',
    'E13': 'Greater London', 'E14': 'Greater London', 'E15': 'Greater London', 'E16': 'Greater London',
    'E17': 'Greater London', 'E18': 'Greater London', 'E20': 'Greater London',
    'N1': 'Greater London', 'N2': 'Greater London', 'N3': 'Greater London', 'N4': 'Greater London',
    'N5': 'Greater London', 'N6': 'Greater London', 'N7': 'Greater London', 'N8': 'Greater London',
    'N9': 'Greater London', 'N10': 'Greater London', 'N11': 'Greater London', 'N12': 'Greater London',
    'N13': 'Greater London', 'N14': 'Greater London', 'N15': 'Greater London', 'N16': 'Greater London',
    'N17': 'Greater London', 'N18': 'Greater London', 'N19': 'Greater London', 'N20': 'Greater London',
    'N21': 'Greater London', 'N22': 'Greater London',
    'W1': 'Greater London', 'W2': 'Greater London', 'W3': 'Greater London', 'W4': 'Greater London',
    'W5': 'Greater London', 'W6': 'Greater London', 'W7': 'Greater London', 'W8': 'Greater London',
    'W9': 'Greater London', 'W10': 'Greater London', 'W11': 'Greater London', 'W12': 'Greater London',
    'W13': 'Greater London', 'W14': 'Greater London', 'W15': 'Greater London', 'W16': 'Greater London',
    'W17': 'Greater London', 'W18': 'Greater London', 'W19': 'Greater London', 'W20': 'Greater London',
    'NW1': 'Greater London', 'NW2': 'Greater London', 'NW3': 'Greater London', 'NW4': 'Greater London',
    'NW5': 'Greater London', 'NW6': 'Greater London', 'NW7': 'Greater London', 'NW8': 'Greater London',
    'NW9': 'Greater London', 'NW10': 'Greater London', 'NW11': 'Greater London', 'NW12': 'Greater London',
    'SE1': 'Greater London', 'SE2': 'Greater London', 'SE3': 'Greater London', 'SE4': 'Greater London',
    'SE5': 'Greater London', 'SE6': 'Greater London', 'SE7': 'Greater London', 'SE8': 'Greater London',
    'SE9': 'Greater London', 'SE10': 'Greater London', 'SE11': 'Greater London', 'SE12': 'Greater London',
    'SE13': 'Greater London', 'SE14': 'Greater London', 'SE15': 'Greater London', 'SE16': 'Greater London',
    'SE17': 'Greater London', 'SE18': 'Greater London', 'SE19': 'Greater London', 'SE20': 'Greater London',
    'SE21': 'Greater London', 'SE22': 'Greater London', 'SE23': 'Greater London', 'SE24': 'Greater London',
    'SE25': 'Greater London', 'SE26': 'Greater London', 'SE27': 'Greater London', 'SE28': 'Greater London',
    'EC1': 'Greater London', 'EC2': 'Greater London', 'EC3': 'Greater London', 'EC4': 'Greater London',
    'WC1': 'Greater London', 'WC2': 'Greater London',
    'SW1A': 'Greater London', 'SW1E': 'Greater London', 'SW1H': 'Greater London', 'SW1P': 'Greater London',
    'SW1V': 'Greater London', 'SW1W': 'Greater London', 'SW1X': 'Greater London', 'SW1Y': 'Greater London',
    'W1A': 'Greater London', 'W1B': 'Greater London', 'W1C': 'Greater London', 'W1D': 'Greater London',
    'W1F': 'Greater London', 'W1G': 'Greater London', 'W1H': 'Greater London', 'W1J': 'Greater London',
    'W1K': 'Greater London', 'W1M': 'Greater London', 'W1N': 'Greater London', 'W1P': 'Greater London',
    'W1S': 'Greater London', 'W1T': 'Greater London', 'W1U': 'Greater London', 'W1W': 'Greater London',
    'W1X': 'Greater London', 'W1Y': 'Greater London',
    'EC1A': 'Greater London', 'EC1M': 'Greater London', 'EC1N': 'Greater London', 'EC1R': 'Greater London',
    'EC1V': 'Greater London', 'EC1Y': 'Greater London', 'EC2A': 'Greater London', 'EC2M': 'Greater London',
    'EC2N': 'Greater London', 'EC2R': 'Greater London', 'EC2V': 'Greater London', 'EC2Y': 'Greater London',
    'EC3A': 'Greater London', 'EC3M': 'Greater London', 'EC3N': 'Greater London', 'EC3P': 'Greater London',
    'EC3R': 'Greater London', 'EC3V': 'Greater London', 'EC4A': 'Greater London', 'EC4M': 'Greater London',
    'EC4N': 'Greater London', 'EC4P': 'Greater London', 'EC4R': 'Greater London', 'EC4V': 'Greater London',
    'EC4Y': 'Greater London',
    'WC1A': 'Greater London', 'WC1B': 'Greater London', 'WC1E': 'Greater London', 'WC1H': 'Greater London',
    'WC1N': 'Greater London', 'WC1R': 'Greater London', 'WC1V': 'Greater London', 'WC1X': 'Greater London',
    'WC2A': 'Greater London', 'WC2B': 'Greater London', 'WC2E': 'Greater London', 'WC2H': 'Greater London',
    'WC2N': 'Greater London', 'WC2R': 'Greater London',
}

def get_county_from_postcode(postcode):
    """
    Determine the county from a UK postcode.
    Returns the county name or 'Unknown' if not found.
    """
    if not postcode:
        return 'Unknown'
    
    # Clean the postcode
    postcode = postcode.strip().upper()
    
    # Remove any extra spaces
    postcode = re.sub(r'\s+', '', postcode)
    
    # Try different patterns
    patterns_to_try = [
        # Full postcode (e.g., SW1A 1AA)
        r'^([A-Z]{1,2}\d{1,2}[A-Z]?)',
        # Area code (e.g., SW1A)
        r'^([A-Z]{1,2}\d{1,2})',
        # Just the area (e.g., SW1)
        r'^([A-Z]{1,2}\d)',
        # Just the letters (e.g., SW)
        r'^([A-Z]{1,2})',
    ]
    
    for pattern in patterns_to_try:
        match = re.match(pattern, postcode)
        if match:
            area_code = match.group(1)
            if area_code in POSTCODE_TO_COUNTY:
                return POSTCODE_TO_COUNTY[area_code]
    
    # If no match found, return Unknown
    return 'Unknown'

def add_county_to_venues():
    """
    Add county information to all venues in the CSV file.
    """
    print("🏴󠁧󠁢󠁥󠁮󠁧󠁿 Adding county information to venues...")
    
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
    county_stats = {}
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        fieldnames = reader.fieldnames
        
        for row in reader:
            # Get county from postcode
            postcode = row.get('PostCode', '').strip()
            county = get_county_from_postcode(postcode)
            
            # Add county to the row
            row['County'] = county
            
            # Track county statistics
            county_stats[county] = county_stats.get(county, 0) + 1
            
            venues.append(row)
    
    # Add County to fieldnames if not already present
    if 'County' not in fieldnames:
        fieldnames.append('County')
    
    # Write updated CSV
    output_file = 'JW and Smirnoff Venues - Sheet1_with_coords.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(venues)
    
    print(f"✅ Successfully added county information to {len(venues)} venues!")
    print(f"📊 County distribution:")
    
    # Sort counties by count (descending)
    sorted_counties = sorted(county_stats.items(), key=lambda x: x[1], reverse=True)
    for county, count in sorted_counties[:20]:  # Show top 20
        print(f"   {county}: {count} venues")
    
    if len(sorted_counties) > 20:
        print(f"   ... and {len(sorted_counties) - 20} more counties")
    
    return len(venues)

if __name__ == "__main__":
    add_county_to_venues()
