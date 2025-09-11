# JW & Smirnoff Venues Map

A modern web application that displays venue locations on an interactive map. **No server required!**

## 🚀 Quick Start

**Super Simple - Just open the HTML file!**

1. Double-click `index.html` to open it in your browser
2. That's it! The app will load all 1,325 venues automatically

## ✨ Why This Works

The venue data is embedded directly in the JavaScript file (`venue-data.js`), so there are no CORS issues or server requirements. You can open the HTML file directly in any browser.

## 📁 Files

- `index.html` - Main application (open this file!)
- `styles.css` - Styling and responsive design
- `script.js` - Application logic and mapping functionality
- `venue-data.js` - Embedded venue data (1,325 venues)
- `JW and Smirnoff Venues - Sheet1.csv` - Original CSV data (for reference)

## 🎯 Features

- **Interactive Map**: View all venues on an OpenStreetMap
- **Search & Filter**: Find venues by name, location, or account manager
- **Geocoding**: Automatically converts addresses to map coordinates
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live filtering and search results
- **No Server Required**: Works by simply opening the HTML file

## 🔧 Troubleshooting

If you encounter any issues:
1. Make sure all files are in the same directory
2. Check the browser console (F12) for any error messages
3. Try refreshing the page

## 📱 Mobile Support

The application is fully responsive and works great on mobile devices. The sidebar becomes a collapsible panel on smaller screens.

## 🔄 Updating Venue Data

If you need to update the venue data:
1. Replace the CSV file with your new data
2. Run: `python3 -c "import csv,json; venues=[]; [venues.append({'id':i,'name':r.get('Name','').strip() or 'Unknown Venue','address1':r.get('Address1','').strip(),'address2':r.get('Address2','').strip(),'town':r.get('Town','').strip(),'postCode':r.get('PostCode','').strip(),'country':r.get('Country','').strip() or 'UK','type':r.get('Type','').strip() or 'Unknown','accountManager':r.get('Account Manager Name','').strip(),'accountManagerEmail':r.get('Account Manager Email','').strip(),'phone':r.get('Phone Number','').strip(),'quantity':r.get('Quantity','').strip() or '1','fullAddress':', '.join([p for p in [r.get('Address1','').strip(),r.get('Address2','').strip(),r.get('Town','').strip(),r.get('PostCode','').strip(),r.get('Country','').strip()] if p])}) for i,r in enumerate(csv.DictReader(open('JW and Smirnoff Venues - Sheet1.csv','r',encoding='utf-8')))]; open('venue-data.js','w').write(f'const VENUE_DATA = {json.dumps(venues,indent=2)};')"`
3. Refresh the page
