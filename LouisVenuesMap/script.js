class VenueMapApp {
    constructor() {
        this.map = null;
        this.venues = [];
        this.filteredVenues = [];
        this.markers = [];
        this.selectedVenue = null;
        
        this.init();
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

        const marker = L.marker(venue.coordinates).addTo(this.map);
        
        // Create popup content
        const popupContent = `
            <div class="popup-title">${venue.name}</div>
            <div class="popup-address">${venue.fullAddress}</div>
            <div class="popup-details">
                <strong>Type:</strong> ${venue.type}<br>
                ${venue.phone ? `<strong>Phone:</strong> ${venue.phone}<br>` : ''}
                ${venue.accountManager ? `<strong>Account Manager:</strong> ${venue.accountManager}<br>` : ''}
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

        document.getElementById('countryFilter').addEventListener('change', () => {
            this.applyFilters();
        });
    }

    populateFilters() {
        const countryFilter = document.getElementById('countryFilter');
        const countries = [...new Set(this.venues.map(v => v.country))].sort();
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countryFilter.appendChild(option);
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
        const countryFilter = document.getElementById('countryFilter').value;
        
        let filtered = [...this.venues];
        
        // Apply search filter
        const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
        if (searchQuery) {
            filtered = filtered.filter(venue => 
                venue.name.toLowerCase().includes(searchQuery) ||
                venue.fullAddress.toLowerCase().includes(searchQuery) ||
                venue.town.toLowerCase().includes(searchQuery) ||
                venue.accountManager.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply type filter
        if (typeFilter) {
            filtered = filtered.filter(venue => venue.type === typeFilter);
        }
        
        // Apply country filter
        if (countryFilter) {
            filtered = filtered.filter(venue => venue.country === countryFilter);
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
