class VenueMapApp {
    constructor() {
        this.map = null;
        this.venues = [];
        this.filteredVenues = [];
        this.markers = [];
        this.selectedVenue = null;
        
        // Color palette for counties (will be generated after venues are loaded)
        this.countyColors = {};
        
        this.init();
    }

    generateCountyColorMap() {
        // Generate a color map for counties using a diverse color palette
        const colors = [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
            '#e67e22', '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad',
            '#f1c40f', '#e74c3c', '#95a5a6', '#d35400', '#c0392b', '#7f8c8d',
            '#2c3e50', '#f39c12', '#e67e22', '#d35400', '#c0392b', '#8e44ad',
            '#9b59b6', '#3498db', '#2980b9', '#1abc9c', '#16a085', '#27ae60',
            '#2ecc71', '#f1c40f', '#e74c3c', '#e67e22', '#d35400', '#c0392b',
            '#8e44ad', '#9b59b6', '#3498db', '#2980b9', '#1abc9c', '#16a085',
            '#27ae60', '#2ecc71', '#f1c40f', '#e74c3c', '#e67e22', '#d35400',
            '#c0392b', '#8e44ad', '#9b59b6', '#3498db', '#2980b9', '#1abc9c',
            '#16a085', '#27ae60', '#2ecc71', '#f1c40f', '#e74c3c', '#e67e22'
        ];
        
        const countyColorMap = {};
        const counties = [...new Set(this.venues.map(v => v.county))].sort();
        
        counties.forEach((county, index) => {
            countyColorMap[county] = colors[index % colors.length];
        });
        
        return countyColorMap;
    }

    createCountyLegend() {
        const legendContent = document.getElementById('legendContent');
        if (!legendContent) return;

        // Get counties sorted by venue count (most venues first)
        const countyCounts = {};
        this.venues.forEach(venue => {
            countyCounts[venue.county] = (countyCounts[venue.county] || 0) + 1;
        });

        const sortedCounties = Object.keys(countyCounts)
            .sort((a, b) => countyCounts[b] - countyCounts[a])
            .slice(0, 20); // Show top 20 counties

        const legendItems = sortedCounties.map(county => {
            const color = this.countyColors[county] || '#666666';
            const count = countyCounts[county];
            return `
                <div class="legend-item" onclick="app.filterByCounty('${county}')">
                    <span class="legend-color" style="background-color: ${color}"></span>
                    <span class="legend-text">${county} (${count})</span>
                </div>
            `;
        }).join('');

        legendContent.innerHTML = legendItems;
    }

    filterByCounty(county) {
        const countyFilter = document.getElementById('countyFilter');
        countyFilter.value = county;
        this.applyFilters();
        // Add a small delay to ensure markers are updated before zooming
        setTimeout(() => {
            this.zoomToCounty(county);
        }, 100);
    }

    getCountyBounds(county) {
        // Get all venues in the specified county that have coordinates
        const countyVenues = this.venues.filter(venue => 
            venue.county === county && venue.coordinates
        );

        if (countyVenues.length === 0) {
            return null;
        }

        // Calculate bounding box
        let minLat = countyVenues[0].coordinates[0];
        let maxLat = countyVenues[0].coordinates[0];
        let minLng = countyVenues[0].coordinates[1];
        let maxLng = countyVenues[0].coordinates[1];

        countyVenues.forEach(venue => {
            const [lat, lng] = venue.coordinates;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });

        // Add some padding around the bounds
        const latPadding = (maxLat - minLat) * 0.1;
        const lngPadding = (maxLng - minLng) * 0.1;

        return [
            [minLat - latPadding, minLng - lngPadding], // Southwest corner
            [maxLat + latPadding, maxLng + lngPadding]   // Northeast corner
        ];
    }

    zoomToCounty(county) {
        if (!county) {
            // If no county selected, fit to all visible markers
            this.zoomToAllVenues();
            return;
        }

        const bounds = this.getCountyBounds(county);
        if (bounds) {
            // Smooth zoom to the county bounds
            this.map.fitBounds(bounds, {
                padding: [20, 20], // Add padding around the bounds
                maxZoom: 12 // Don't zoom in too close
            });
        }
    }

    zoomToAllVenues() {
        // Get all venues with coordinates
        const venuesWithCoords = this.venues.filter(venue => venue.coordinates);
        
        if (venuesWithCoords.length === 0) {
            return;
        }

        // Calculate bounds for all venues
        let minLat = venuesWithCoords[0].coordinates[0];
        let maxLat = venuesWithCoords[0].coordinates[0];
        let minLng = venuesWithCoords[0].coordinates[1];
        let maxLng = venuesWithCoords[0].coordinates[1];

        venuesWithCoords.forEach(venue => {
            const [lat, lng] = venue.coordinates;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });

        const bounds = [
            [minLat, minLng],
            [maxLat, maxLng]
        ];

        this.map.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 6 // Don't zoom in too close when showing all
        });
    }

    init() {
        try {
            this.loadVenues();
            this.initializeMap();
            this.setupEventListeners();
            this.populateFilters();
            this.updateVenueCount();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to load venues. Please check the venue data.');
        }
    }

    loadVenues() {
        try {
            console.log('Loading embedded venue data...');
            
            // Check if venue data is available
            if (typeof VENUE_DATA === 'undefined') {
                throw new Error('Venue data not found. Please make sure venue-data.js is loaded.');
            }
            
            // Process the embedded data
            this.venues = VENUE_DATA.map(venue => {
                let coordinates = null;
                
                // Check if venue already has coordinates
                if (venue.latitude && venue.longitude) {
                    const lat = parseFloat(venue.latitude);
                    const lng = parseFloat(venue.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        coordinates = [lat, lng];
                    }
                }
                
                return {
                    ...venue,
                    coordinates: coordinates
                };
            });

            this.filteredVenues = [...this.venues];
            
            // Generate county color map after venues are loaded
            this.countyColors = this.generateCountyColorMap();
            
            // Create county legend
            this.createCountyLegend();
            
            console.log(`Successfully loaded ${this.venues.length} venues from embedded data`);
        } catch (error) {
            console.error('Error loading venue data:', error);
            this.showError(`Failed to load venue data: ${error.message}`);
            throw error;
        }
    }

    buildFullAddress(row) {
        const parts = [
            row.Address1,
            row.Address2,
            row.Town,
            row.PostCode,
            row.Country
        ].filter(part => part && part.trim());
        
        return parts.join(', ');
    }

    initializeMap() {
        // Initialize map centered on UK
        this.map = L.map('map').setView([54.5, -3.5], 6);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add venues to map
        this.addVenuesToMap();
    }

    async addVenuesToMap() {
        const loadingElement = document.getElementById('venueCount');
        
        // Check how many venues already have coordinates
        const venuesWithCoords = this.filteredVenues.filter(v => v.coordinates);
        const venuesNeedingGeocoding = this.filteredVenues.filter(v => !v.coordinates);
        
        console.log(`Found ${venuesWithCoords.length} venues with coordinates, ${venuesNeedingGeocoding.length} need geocoding`);
        
        // Add venues with existing coordinates immediately
        venuesWithCoords.forEach(venue => {
            this.addMarkerToMap(venue);
        });
        
        // If all venues have coordinates, we're done!
        if (venuesNeedingGeocoding.length === 0) {
            console.log('All venues have coordinates - map loaded instantly!');
            this.updateVenueCount();
            return;
        }
        
        // Only geocode venues that don't have coordinates
        loadingElement.textContent = `Geocoding ${venuesNeedingGeocoding.length} venues...`;
        
        let geocodedCount = 0;
        const batchSize = 10; // Process venues in batches to avoid overwhelming the geocoding service

        for (let i = 0; i < venuesNeedingGeocoding.length; i += batchSize) {
            const batch = venuesNeedingGeocoding.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (venue) => {
                try {
                    const coords = await this.geocodeAddress(venue.fullAddress);
                    if (coords) {
                        venue.coordinates = coords;
                        this.addMarkerToMap(venue);
                        geocodedCount++;
                    }
                } catch (error) {
                    console.warn(`Failed to geocode ${venue.name}:`, error);
                }
            }));

            // Update progress
            loadingElement.textContent = `Geocoding venues... ${geocodedCount + venuesWithCoords.length}/${this.filteredVenues.length}`;
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.updateVenueCount();
    }

    async geocodeAddress(address) {
        try {
            // Using Nominatim (OpenStreetMap's geocoding service)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=gb,us,ca,au,ie`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
            
            return null;
        } catch (error) {
            console.warn(`Geocoding failed for address: ${address}`, error);
            return null;
        }
    }

    addMarkerToMap(venue) {
        if (!venue.coordinates) return;

        // Get county color
        const countyColor = this.countyColors[venue.county] || '#666666';
        
        // Create custom colored marker
        const marker = L.circleMarker(venue.coordinates, {
            radius: 8,
            fillColor: countyColor,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.map);

        // Add hover effects
        marker.on('mouseover', function() {
            this.setStyle({
                radius: 10,
                weight: 3
            });
        });

        marker.on('mouseout', function() {
            this.setStyle({
                radius: 8,
                weight: 2
            });
        });
        
        // Create popup content
        const popupContent = `
            <div class="popup-title">${venue.name}</div>
            <div class="popup-address">${venue.fullAddress}</div>
            <div class="popup-details">
                <strong>Type:</strong> ${venue.type}<br>
                ${venue.county ? `<strong>County:</strong> ${venue.county}<br>` : ''}
                ${venue.accountManager ? `<strong>Account Manager:</strong> ${venue.accountManager}<br>` : ''}
                ${venue.phone ? `<strong>Phone:</strong> ${venue.phone}<br>` : ''}
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Store marker reference
        this.markers.push({
            marker: marker,
            venue: venue
        });

        // Add click handler
        marker.on('click', () => {
            this.selectVenue(venue);
        });
    }

    selectVenue(venue) {
        this.selectedVenue = venue;
        this.updateVenueList();
        this.highlightSelectedVenue();
    }

    highlightSelectedVenue() {
        // Remove previous selection
        document.querySelectorAll('.venue-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Highlight selected venue
        const venueElement = document.querySelector(`[data-venue-id="${venue.id}"]`);
        if (venueElement) {
            venueElement.classList.add('selected');
            venueElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    updateVenueList() {
        const venueList = document.getElementById('venueList');
        
        if (this.filteredVenues.length === 0) {
            venueList.innerHTML = '<p class="loading">No venues found matching your criteria.</p>';
            return;
        }

        const venueItems = this.filteredVenues.map(venue => `
            <div class="venue-item ${venue === this.selectedVenue ? 'selected' : ''}" 
                 data-venue-id="${venue.id}" 
                 onclick="app.selectVenueFromList(${venue.id})">
                <div class="venue-name">${venue.name}</div>
                <div class="venue-address">${venue.fullAddress}</div>
                <div class="venue-details">
                    <span class="venue-tag ${venue.type.toLowerCase()}">${venue.type}</span>
                    ${venue.county ? `<span class="venue-tag county">${venue.county}</span>` : ''}
                    ${venue.phone ? `<span class="venue-tag">${venue.phone}</span>` : ''}
                </div>
            </div>
        `).join('');

        venueList.innerHTML = venueItems;
    }

    selectVenueFromList(venueId) {
        const venue = this.venues.find(v => v.id === venueId);
        if (venue) {
            this.selectVenue(venue);
            
            // Center map on venue if it has coordinates
            if (venue.coordinates) {
                this.map.setView(venue.coordinates, 15);
                
                // Find and open the marker popup
                const markerData = this.markers.find(m => m.venue.id === venueId);
                if (markerData) {
                    markerData.marker.openPopup();
                }
            }
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        const performSearch = () => {
            const query = searchInput.value.toLowerCase().trim();
            this.filterVenues(query);
        };

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Filter functionality
        document.getElementById('typeFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('countyFilter').addEventListener('change', (e) => {
            const selectedCounty = e.target.value;
            this.applyFilters();
            // Add a small delay to ensure markers are updated before zooming
            setTimeout(() => {
                this.zoomToCounty(selectedCounty);
            }, 100);
        });
    }

    populateFilters() {
        const countyFilter = document.getElementById('countyFilter');
        
        // Populate county filter with venue counts
        const countyCounts = {};
        this.venues.forEach(venue => {
            countyCounts[venue.county] = (countyCounts[venue.county] || 0) + 1;
        });
        
        const counties = [...new Set(this.venues.map(v => v.county))].sort();
        counties.forEach(county => {
            const option = document.createElement('option');
            option.value = county;
            const count = countyCounts[county];
            option.textContent = `${county} - ${count} venue${count !== 1 ? 's' : ''}`;
            countyFilter.appendChild(option);
        });
    }

    filterVenues(query) {
        this.filteredVenues = this.venues.filter(venue => 
            venue.name.toLowerCase().includes(query) ||
            venue.fullAddress.toLowerCase().includes(query) ||
            venue.town.toLowerCase().includes(query) ||
            venue.accountManager.toLowerCase().includes(query)
        );
        
        this.applyFilters();
    }

    applyFilters() {
        const typeFilter = document.getElementById('typeFilter').value;
        const countyFilter = document.getElementById('countyFilter').value;
        
        let filtered = [...this.venues];
        
        // Apply search filter
        const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
        if (searchQuery) {
            filtered = filtered.filter(venue => 
                venue.name.toLowerCase().includes(searchQuery) ||
                venue.fullAddress.toLowerCase().includes(searchQuery) ||
                venue.town.toLowerCase().includes(searchQuery) ||
                venue.county.toLowerCase().includes(searchQuery) ||
                venue.accountManager.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply type filter
        if (typeFilter) {
            filtered = filtered.filter(venue => venue.type === typeFilter);
        }
        
        // Apply county filter
        if (countyFilter) {
            filtered = filtered.filter(venue => venue.county === countyFilter);
        }
        
        this.filteredVenues = filtered;
        this.updateMap();
        this.updateVenueList();
        this.updateVenueCount();
    }

    updateMap() {
        // Clear existing markers
        this.markers.forEach(markerData => {
            this.map.removeLayer(markerData.marker);
        });
        this.markers = [];

        // Add new markers for filtered venues
        this.filteredVenues.forEach(venue => {
            if (venue.coordinates) {
                this.addMarkerToMap(venue);
            }
        });

        // Fit map to show all markers
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers.map(m => m.marker));
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    updateVenueCount() {
        const count = this.filteredVenues.length;
        const total = this.venues.length;
        document.getElementById('venueCount').textContent = 
            count === total ? `${total} venues` : `${count} of ${total} venues`;
    }

    showError(message) {
        const venueList = document.getElementById('venueList');
        venueList.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VenueMapApp();
});
