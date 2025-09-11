#!/usr/bin/env python3
"""
Create 10 regional groupings of UK counties for the venue map.
Each group should have similar venue counts and contain geographically adjacent counties.
"""

import json

# Define 10 regional groups based on geography and venue distribution
REGIONAL_GROUPS = {
    "North West England": {
        "counties": ["Greater Manchester", "Lancashire", "Cheshire", "Merseyside", "Cumbria"],
        "target_venues": 130
    },
    "Greater London & South East": {
        "counties": ["Greater London", "Surrey", "Kent", "Hertfordshire", "Essex", "Buckinghamshire", "Berkshire", "East Sussex", "Hampshire"],
        "target_venues": 130
    },
    "West Midlands": {
        "counties": ["West Midlands", "Worcestershire", "Warwickshire", "Staffordshire", "Shropshire"],
        "target_venues": 130
    },
    "Scotland Central": {
        "counties": ["Edinburgh", "Glasgow", "Fife", "Renfrewshire", "Falkirk", "North Lanarkshire", "Dundee"],
        "target_venues": 130
    },
    "Yorkshire & Humber": {
        "counties": ["South Yorkshire", "West Yorkshire", "North Yorkshire", "East Yorkshire", "Lincolnshire"],
        "target_venues": 130
    },
    "East Midlands": {
        "counties": ["Nottinghamshire", "Derbyshire", "Leicestershire", "Northamptonshire"],
        "target_venues": 130
    },
    "South West England": {
        "counties": ["Devon", "Cornwall", "Somerset", "Dorset", "Wiltshire", "Bristol", "Gloucestershire"],
        "target_venues": 130
    },
    "East of England": {
        "counties": ["Norfolk", "Suffolk", "Cambridgeshire", "Hertfordshire", "Oxfordshire"],
        "target_venues": 130
    },
    "North East England": {
        "counties": ["Tyne and Wear", "County Durham", "Cleveland"],
        "target_venues": 130
    },
    "Scotland North & Wales": {
        "counties": ["Aberdeenshire", "Perth and Kinross", "East Ayrshire", "Cardiff", "Clwyd", "Gwent", "West Glamorgan", "Unknown"],
        "target_venues": 130
    }
}

def create_county_to_region_mapping():
    """Create a mapping from individual counties to regional groups."""
    county_to_region = {}
    
    for region_name, region_data in REGIONAL_GROUPS.items():
        for county in region_data["counties"]:
            county_to_region[county] = region_name
    
    return county_to_region

def analyze_regional_distribution():
    """Analyze how venues would be distributed across regional groups."""
    # Load venue data
    with open('venue-data.js', 'r') as f:
        content = f.read()
        start = content.find('[')
        end = content.rfind(']') + 1
        venues = json.loads(content[start:end])
    
    # Create county to region mapping
    county_to_region = create_county_to_region_mapping()
    
    # Count venues per region
    region_counts = {}
    for venue in venues:
        county = venue.get('county', 'Unknown')
        region = county_to_region.get(county, 'Other')
        region_counts[region] = region_counts.get(region, 0) + 1
    
    print("Regional Distribution:")
    total_venues = sum(region_counts.values())
    for region, count in sorted(region_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"{region}: {count} venues")
    
    print(f"\nTotal venues: {total_venues}")
    print(f"Average per region: {total_venues / len(region_counts):.1f} venues")
    
    return county_to_region

def update_venue_data_with_regions():
    """Update venue data to include regional group information."""
    # Load venue data
    with open('venue-data.js', 'r') as f:
        content = f.read()
        start = content.find('[')
        end = content.rfind(']') + 1
        venues = json.loads(content[start:end])
    
    # Create county to region mapping
    county_to_region = create_county_to_region_mapping()
    
    # Add region to each venue
    for venue in venues:
        county = venue.get('county', 'Unknown')
        venue['region'] = county_to_region.get(county, 'Other')
    
    # Generate updated JavaScript
    js_code = f"""
// Venue data with regional groupings
// {len(venues)} venues across {len(set(v['region'] for v in venues))} regional groups
const VENUE_DATA = {json.dumps(venues, indent=2)};
"""
    
    # Write to JavaScript file
    with open('venue-data.js', 'w', encoding='utf-8') as f:
        f.write(js_code)
    
    print(f"✅ Updated venue-data.js with regional groupings!")
    print(f"📊 Processed {len(venues)} venues")
    print(f"🌍 Created {len(set(v['region'] for v in venues))} regional groups")

if __name__ == "__main__":
    print("🗺️  Creating regional groupings for UK venues...")
    
    # Analyze current distribution
    county_to_region = analyze_regional_distribution()
    
    print("\n" + "="*50)
    print("Updating venue data with regional groups...")
    
    # Update venue data
    update_venue_data_with_regions()
    
    print("\n🎉 Regional grouping complete!")
