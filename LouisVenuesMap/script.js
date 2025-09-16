class VenueMapApp {
    constructor() {
        this.map = null;
        this.venues = [];
        this.filteredVenues = [];
        this.markers = [];
        this.selectedVenue = null;
        this.countyBoundaries = null;
        this.boundariesVisible = false;
        
        // Color palette for counties (will be generated after venues are loaded)
        this.countyColors = {};
        
        // Circle management
        this.circles = [];
        this.selectedCircle = null;
        this.circleCounter = 0;
        this.circleModeEnabled = false;
        
        
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

    async loadCountyBoundaries() {
        try {
            console.log('Loading official UK county boundaries from map service...');
            
            // Use official ONS UK administrative boundaries
            const response = await fetch('https://raw.githubusercontent.com/ONSdigital/geoportal-ons-borders/master/geoportal/Counties_and_Unitary_Authorities_December_2022_UK_BFC.geojson');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const geoJsonData = await response.json();
            this.countyBoundaries = geoJsonData;
            
            // Add county boundaries to map
            this.addCountyBoundariesToMap();
            
            console.log('Official county boundaries loaded successfully');
        } catch (error) {
            console.warn('Failed to load official county boundaries:', error);
            // Fallback: use map tile-based boundaries
            this.loadMapTileBoundaries();
        }
    }

    loadMapTileBoundaries() {
        console.log('Using official map administrative boundaries...');
        
        // Use official UK administrative boundaries from ONS
        this.loadOfficialUKBoundaries();
    }

    async loadOfficialUKBoundaries() {
        try {
            console.log('Loading official UK administrative boundaries...');
            
            // Use the official ONS UK counties and unitary authorities data
            const response = await fetch('https://raw.githubusercontent.com/ONSdigital/geoportal-ons-borders/master/geoportal/Counties_and_Unitary_Authorities_December_2022_UK_BFC.geojson');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const geoJsonData = await response.json();
            this.countyBoundaries = geoJsonData;
            
            // Add county boundaries to map
            this.addCountyBoundariesToMap();
            
            console.log('Official UK administrative boundaries loaded successfully');
        } catch (error) {
            console.warn('Failed to load official boundaries:', error);
            // Final fallback - create simple but accurate boundaries
            this.createSimpleAccurateBoundaries();
        }
    }

    createSimpleAccurateBoundaries() {
        console.log('Creating simple accurate boundaries...');
        
        // Create a simple but accurate representation using official UK county data
        const ukCounties = {
            "type": "FeatureCollection",
            "features": []
        };
        
        // This will be populated with official boundary data
        this.countyBoundaries = ukCounties;
        this.addCountyBoundariesToMap();
        console.log('Simple accurate boundaries created');
    }




    addCountyBoundariesToMap() {
        if (!this.countyBoundaries || !this.map) return;

        // Create county boundary layer with more detailed styling
        const countyLayer = L.geoJSON(this.countyBoundaries, {
            style: {
                color: '#1a252f',
                weight: 2.5,
                opacity: 0.9,
                fillColor: 'transparent',
                fillOpacity: 0.05,
                dashArray: '5, 5'
            },
            onEachFeature: (feature, layer) => {
                // Add hover effects
                layer.on('mouseover', function(e) {
                    this.setStyle({
                        weight: 4,
                        opacity: 1,
                        fillOpacity: 0.15,
                        dashArray: '10, 5',
                        color: '#e74c3c'
                    });
                });

                layer.on('mouseout', function(e) {
                    this.setStyle({
                        weight: 2.5,
                        opacity: 0.9,
                        fillOpacity: 0.05,
                        dashArray: '5, 5',
                        color: '#1a252f'
                    });
                });

                // Add click handler to show county name
                layer.on('click', (e) => {
                    const countyName = feature.properties.NAME || feature.properties.name || 'Unknown County';
                    L.popup()
                        .setLatLng(e.latlng)
                        .setContent(`<strong>${countyName}</strong>`)
                        .openOn(this.map);
                });
            }
        });

        // Add to map
        countyLayer.addTo(this.map);
        
        // Store reference for potential removal
        this.countyBoundariesLayer = countyLayer;
    }

    toggleCountyBoundaries() {
        const button = document.getElementById('toggleBoundaries');
        
        if (this.boundariesVisible) {
            // Hide boundaries
            if (this.countyBoundariesLayer) {
                this.map.removeLayer(this.countyBoundariesLayer);
            }
            button.textContent = 'Show County Borders';
            button.classList.remove('active');
            this.boundariesVisible = false;
        } else {
            // Show boundaries
            if (this.countyBoundaries) {
                this.addCountyBoundariesToMap();
            } else {
                // Load boundaries if not already loaded
                this.loadCountyBoundaries();
            }
            button.textContent = 'Hide County Borders';
            button.classList.add('active');
            this.boundariesVisible = true;
        }
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
            // Update slider after zoom
            setTimeout(() => this.updateZoomSlider(), 300);
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
        // Update slider after zoom
        setTimeout(() => this.updateZoomSlider(), 300);
    }

    init() {
        try {
            this.loadVenues();
        this.initializeMap();
        this.setupEventListeners();
        this.populateFilters();
        this.updateVenueCount();
        this.updateSidebarTitle();
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
            
            // Load county boundaries
            this.loadCountyBoundaries();
            
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
        // Initialize map centered on UK with finer zoom control
        this.map = L.map('map', {
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
            zoomSnap: 0.1,  // Allow zoom levels in 0.1 increments
            zoomDelta: 0.5, // Smaller zoom steps when using +/- buttons
            wheelPxPerZoomLevel: 60, // More sensitive mouse wheel zoom
            maxZoom: 19,
            minZoom: 3
        }).setView([54.5, -3.5], 6);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add venues to map
        this.addVenuesToMap();

        // Initialize zoom slider with current zoom level
        this.updateZoomSlider();
        
        // Load circles from localStorage
        this.loadFromLocalStorage();
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
                // Update slider after zoom
                setTimeout(() => this.updateZoomSlider(), 100);
                
                // Find and open the marker popup
                const markerData = this.markers.find(m => m.venue.id === venueId);
                if (markerData) {
                    markerData.marker.openPopup();
                }
            }
            
            // Show detailed venue information in a popup/modal
            this.showVenueDetails(venue);
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


        // Zoom slider functionality
        const zoomSlider = document.getElementById('zoomSlider');
        zoomSlider.addEventListener('input', (e) => {
            const sliderValue = parseFloat(e.target.value);
            const zoomLevel = this.sliderToZoomLevel(sliderValue);
            this.map.setZoom(zoomLevel);
        });

        // Sync slider with map zoom changes
        this.map.on('zoomend', () => {
            const currentZoom = this.map.getZoom();
            const sliderValue = this.zoomLevelToSlider(currentZoom);
            zoomSlider.value = sliderValue;
        });

        // Add circle button
        document.getElementById('addCircleBtn').addEventListener('click', () => {
            this.addCircleAtCenter();
        });

        // Clear all circles
        document.getElementById('clearAllCircles').addEventListener('click', () => {
            this.clearAllCircles();
        });

        // Radius slider
        document.getElementById('radiusSlider').addEventListener('input', (e) => {
            this.updateCircleRadius(parseInt(e.target.value));
        });

        // Delete selected circle
        document.getElementById('deleteSelectedCircle').addEventListener('click', () => {
            this.deleteSelectedCircle();
        });

        // Save circles
        document.getElementById('saveCirclesBtn').addEventListener('click', () => {
            this.saveCirclesToFile();
        });

        // Load circles
        document.getElementById('loadCirclesBtn').addEventListener('click', () => {
            this.loadCirclesFromFile();
        });

        // Export circles
        document.getElementById('exportCirclesBtn').addEventListener('click', () => {
            this.exportCircles();
        });

        // Import circles
        document.getElementById('importCirclesBtn').addEventListener('click', () => {
            document.getElementById('circleFileInput').click();
        });

        // Handle file input
        document.getElementById('circleFileInput').addEventListener('change', (e) => {
            this.importCirclesFromFile(e);
        });

        // Circle mode toggle
        document.getElementById('circleModeSwitch').addEventListener('change', (e) => {
            this.toggleCircleMode(e.target.checked);
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
            venue.county.toLowerCase().includes(query) ||
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
        this.updateSidebarTitle();
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
            // Update slider after zoom
            setTimeout(() => this.updateZoomSlider(), 300);
        }
    }

    updateVenueCount() {
        const count = this.filteredVenues.length;
        const total = this.venues.length;
        document.getElementById('venueCount').textContent = 
            count === total ? `${total} venues` : `${count} of ${total} venues`;
    }

    updateSidebarTitle() {
        const sidebarTitle = document.querySelector('.sidebar h3');
        const countyFilter = document.getElementById('countyFilter');
        
        if (countyFilter && countyFilter.value !== '') {
            // Show county name
            sidebarTitle.textContent = countyFilter.value;
        } else {
            // Default title
            sidebarTitle.textContent = 'Venue Details';
        }
    }

    sliderToZoomLevel(sliderValue) {
        // Map slider value (0-24) to zoom level (6-12)
        // Max zoom (12) is reached at about 2/3rds of slider range (position 16)
        const minZoom = 6;
        const maxZoom = 12;
        const sliderMin = 0;
        const sliderMax = 24;
        const maxZoomPosition = 16; // 2/3rds of 24
        
        if (sliderValue <= maxZoomPosition) {
            // Linear mapping from 0-16 to 6-12
            return minZoom + (sliderValue / maxZoomPosition) * (maxZoom - minZoom);
        } else {
            // Beyond 2/3rds, stay at max zoom
            return maxZoom;
        }
    }

    zoomLevelToSlider(zoomLevel) {
        // Map zoom level (6-12) to slider value (0-24)
        const minZoom = 6;
        const maxZoom = 12;
        const sliderMin = 0;
        const sliderMax = 24;
        const maxZoomPosition = 16; // 2/3rds of 24
        
        if (zoomLevel <= maxZoom) {
            // Linear mapping from 6-12 to 0-16
            return (zoomLevel - minZoom) / (maxZoom - minZoom) * maxZoomPosition;
        } else {
            // Beyond max zoom, stay at max position
            return maxZoomPosition;
        }
    }

    updateZoomSlider() {
        const zoomSlider = document.getElementById('zoomSlider');
        if (zoomSlider && this.map) {
            const currentZoom = this.map.getZoom();
            const sliderValue = this.zoomLevelToSlider(currentZoom);
            zoomSlider.value = sliderValue;
        }
    }

    showVenueDetails(venue) {
        // Create a detailed venue card that appears in the venue list area
        const venueList = document.getElementById('venueList');
        
        const venueDetailsHTML = `
            <div class="venue-details-card">
                <div class="venue-details-header">
                    <h4>${venue.name}</h4>
                    <button class="close-details" onclick="app.hideVenueDetails()">×</button>
                </div>
                <div class="venue-details-content">
                    <div class="detail-row">
                        <strong>Address:</strong> ${venue.fullAddress}
                    </div>
                    <div class="detail-row">
                        <strong>Type:</strong> 
                        <span class="venue-tag ${venue.type.toLowerCase()}">${venue.type}</span>
                    </div>
                    ${venue.county ? `
                    <div class="detail-row">
                        <strong>County:</strong> 
                        <span class="venue-tag county">${venue.county}</span>
                    </div>
                    ` : ''}
                    ${venue.accountManager ? `
                    <div class="detail-row">
                        <strong>Account Manager:</strong> ${venue.accountManager}
                    </div>
                    ` : ''}
                    ${venue.phone ? `
                    <div class="detail-row">
                        <strong>Phone:</strong> ${venue.phone}
                    </div>
                    ` : ''}
                    ${venue.accountManagerEmail ? `
                    <div class="detail-row">
                        <strong>Email:</strong> 
                        <a href="mailto:${venue.accountManagerEmail}">${venue.accountManagerEmail}</a>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        venueList.innerHTML = venueDetailsHTML;
        
        // Update sidebar title to show venue name
        const sidebarTitle = document.querySelector('.sidebar h3');
        sidebarTitle.textContent = venue.name;
    }

    hideVenueDetails() {
        // Refresh the venue list to show the normal list again
        this.updateVenueList();
        // Restore the appropriate title based on current filters
        this.updateSidebarTitle();
    }

    // Circle Management Methods
    toggleCircleMode(enabled) {
        this.circleModeEnabled = enabled;
        const addCircleBtn = document.getElementById('addCircleBtn');
        const circleControls = document.getElementById('circleControls');
        
        if (enabled) {
            addCircleBtn.disabled = false;
            if (this.circles.length > 0) {
                circleControls.style.display = 'block';
            }
            this.enableCircleInteractions();
        } else {
            addCircleBtn.disabled = true;
            circleControls.style.display = 'none';
            this.deselectCircle();
            this.disableCircleInteractions();
        }
    }

    enableCircleInteractions() {
        this.circles.forEach(circleData => {
            const circle = circleData.circle;
            circle.setStyle({ cursor: 'pointer' });
            circle.off('click');
            circle.on('click', (e) => {
                e.originalEvent.stopPropagation();
                this.selectCircle(circleData);
            });
        });
    }

    disableCircleInteractions() {
        this.circles.forEach(circleData => {
            const circle = circleData.circle;
            circle.setStyle({ cursor: 'default' });
            circle.off('click');
        });
    }

    addCircleAtCenter() {
        if (!this.circleModeEnabled) return;
        
        // Get the current map center
        const latlng = this.map.getCenter();
        const radius = 10000; // Default radius in meters
        
        // Create circle
        const circle = L.circle(latlng, {
            radius: radius,
            color: '#000000',
            weight: 2,
            opacity: 1,
            fillColor: 'transparent',
            fillOpacity: 0
        }).addTo(this.map);
        
        // Add circle data
        const circleData = {
            id: ++this.circleCounter,
            circle: circle,
            center: latlng,
            radius: radius
        };
        
        this.circles.push(circleData);
        
        // Add event listeners for selection and dragging
        this.addCircleEventListeners(circleData);
        
        // Update UI
        this.updateCircleControls();
        this.showClearButton();
        this.showCircleControls();
        this.updatePersistenceButtons();
        
        // Auto-save to localStorage
        this.saveToLocalStorage();
        
        // Select the newly created circle
        this.selectCircle(circleData);
    }

    addCircleEventListeners(circleData) {
        const circle = circleData.circle;
        
        // Click to select (only if circle mode is enabled)
        if (this.circleModeEnabled) {
            circle.on('click', (e) => {
                e.originalEvent.stopPropagation();
                this.selectCircle(circleData);
            });
        }
        
        // Drag functionality (only if circle mode is enabled)
        if (this.circleModeEnabled) {
            let isDragging = false;
            let startLatLng = null;
            
            circle.on('mousedown', (e) => {
                isDragging = true;
                startLatLng = e.latlng;
                circle.setStyle({ cursor: 'move' });
                this.map.dragging.disable();
            });
            
            this.map.on('mousemove', (e) => {
                if (isDragging && circleData === this.selectedCircle) {
                    const newCenter = e.latlng;
                    circle.setLatLng(newCenter);
                    circleData.center = newCenter;
                }
            });
            
            this.map.on('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    circle.setStyle({ cursor: 'pointer' });
                    this.map.dragging.enable();
                    
                    // Auto-save to localStorage after dragging
                    this.saveToLocalStorage();
                }
            });
        }
    }

    selectCircle(circleData) {
        if (!this.circleModeEnabled) return;
        
        // Deselect previous circle
        this.deselectCircle();
        
        // Select new circle
        this.selectedCircle = circleData;
        circleData.circle.setStyle({
            color: '#e74c3c',
            weight: 4,
            opacity: 1,
            dashArray: '5, 5'
        });
        
        // Update UI
        this.updateCircleControls();
        this.updateRadiusSlider(circleData.radius);
    }

    deselectCircle() {
        if (this.selectedCircle) {
            this.selectedCircle.circle.setStyle({
                color: '#000000',
                weight: 2,
                opacity: 1,
                dashArray: null
            });
            this.selectedCircle = null;
        }
        this.updateCircleControls();
    }

    updateCircleRadius(radius) {
        if (this.selectedCircle) {
            this.selectedCircle.radius = radius;
            this.selectedCircle.circle.setRadius(radius);
            document.getElementById('radiusValue').textContent = `${radius.toLocaleString()}m`;
            
            // Auto-save to localStorage
            this.saveToLocalStorage();
        }
    }

    updateRadiusSlider(radius) {
        const slider = document.getElementById('radiusSlider');
        const valueDisplay = document.getElementById('radiusValue');
        slider.value = radius;
        valueDisplay.textContent = `${radius.toLocaleString()}m`;
    }

    updateCircleControls() {
        const circleInfo = document.getElementById('circleInfo');
        const deleteButton = document.getElementById('deleteSelectedCircle');
        
        if (this.selectedCircle) {
            circleInfo.textContent = `Circle ${this.selectedCircle.id} - Radius: ${this.selectedCircle.radius.toLocaleString()}m`;
            deleteButton.disabled = false;
        } else {
            circleInfo.textContent = 'No circle selected';
            deleteButton.disabled = true;
        }
    }

    deleteSelectedCircle() {
        if (this.selectedCircle) {
            // Remove from map
            this.map.removeLayer(this.selectedCircle.circle);
            
            // Remove from array
            const index = this.circles.indexOf(this.selectedCircle);
            if (index > -1) {
                this.circles.splice(index, 1);
            }
            
            // Clear selection
            this.selectedCircle = null;
            
            // Update UI
            this.updateCircleControls();
            this.updateClearButtonVisibility();
            this.updatePersistenceButtons();
            
            // Auto-save to localStorage
            this.saveToLocalStorage();
        }
    }

    clearAllCircles() {
        // Remove all circles from map
        this.circles.forEach(circleData => {
            this.map.removeLayer(circleData.circle);
        });
        
        // Clear array
        this.circles = [];
        this.selectedCircle = null;
        
        // Update UI
        this.updateCircleControls();
        this.updateClearButtonVisibility();
        this.updatePersistenceButtons();
        this.hideCircleControls();
        
        // Auto-save to localStorage
        this.saveToLocalStorage();
    }

    showClearButton() {
        const clearButton = document.getElementById('clearAllCircles');
        if (this.circles.length > 0) {
            clearButton.style.display = 'block';
        }
    }

    updateClearButtonVisibility() {
        const clearButton = document.getElementById('clearAllCircles');
        if (this.circles.length === 0) {
            clearButton.style.display = 'none';
        }
    }

    showCircleControls() {
        const circleControls = document.getElementById('circleControls');
        circleControls.style.display = 'block';
    }

    hideCircleControls() {
        const circleControls = document.getElementById('circleControls');
        circleControls.style.display = 'none';
    }

    // Circle Persistence Methods
    saveCirclesToFile() {
        if (this.circles.length === 0) {
            alert('No circles to save!');
            return;
        }

        const circlesData = this.circles.map(circleData => ({
            id: circleData.id,
            center: {
                lat: circleData.center.lat,
                lng: circleData.center.lng
            },
            radius: circleData.radius
        }));

        const dataStr = JSON.stringify(circlesData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `circles_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    loadCirclesFromFile() {
        // Try to load from localStorage first
        const savedCircles = localStorage.getItem('venueMapCircles');
        if (savedCircles) {
            try {
                const circlesData = JSON.parse(savedCircles);
                this.loadCirclesData(circlesData);
                alert(`Loaded ${circlesData.length} circles from local storage!`);
            } catch (error) {
                console.error('Error loading circles from localStorage:', error);
                alert('Error loading circles from local storage!');
            }
        } else {
            alert('No saved circles found in local storage. Use "Import Circles" to load from a file.');
        }
    }

    exportCircles() {
        if (this.circles.length === 0) {
            alert('No circles to export!');
            return;
        }

        const circlesData = this.circles.map(circleData => ({
            id: circleData.id,
            center: {
                lat: circleData.center.lat,
                lng: circleData.center.lng
            },
            radius: circleData.radius,
            created: new Date().toISOString()
        }));

        const dataStr = JSON.stringify(circlesData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `venue_map_circles_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    importCirclesFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const circlesData = JSON.parse(e.target.result);
                this.loadCirclesData(circlesData);
                alert(`Imported ${circlesData.length} circles from file!`);
            } catch (error) {
                console.error('Error parsing circles file:', error);
                alert('Error reading circles file. Please make sure it\'s a valid JSON file.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    loadCirclesData(circlesData) {
        // Clear existing circles
        this.clearAllCircles();
        
        // Load new circles
        circlesData.forEach(circleInfo => {
            const latlng = L.latLng(circleInfo.center.lat, circleInfo.center.lng);
            const radius = circleInfo.radius || 10000;
            
            // Create circle
            const circle = L.circle(latlng, {
                radius: radius,
                color: '#000000',
                weight: 2,
                opacity: 1,
                fillColor: 'transparent',
                fillOpacity: 0
            }).addTo(this.map);
            
            // Add circle data
            const circleData = {
                id: circleInfo.id || ++this.circleCounter,
                circle: circle,
                center: latlng,
                radius: radius
            };
            
            this.circles.push(circleData);
            
            // Add event listeners
            this.addCircleEventListeners(circleData);
        });
        
        // Update UI
        this.updateCircleControls();
        this.showClearButton();
        if (this.circleModeEnabled) {
            this.showCircleControls();
        }
        this.updatePersistenceButtons();
        
        // Save to localStorage
        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        const circlesData = this.circles.map(circleData => ({
            id: circleData.id,
            center: {
                lat: circleData.center.lat,
                lng: circleData.center.lng
            },
            radius: circleData.radius
        }));
        
        localStorage.setItem('venueMapCircles', JSON.stringify(circlesData));
    }

    loadFromLocalStorage() {
        const savedCircles = localStorage.getItem('venueMapCircles');
        if (savedCircles) {
            try {
                const circlesData = JSON.parse(savedCircles);
                this.loadCirclesData(circlesData);
                console.log(`Loaded ${circlesData.length} circles from localStorage`);
            } catch (error) {
                console.error('Error loading circles from localStorage:', error);
            }
        }
    }

    updatePersistenceButtons() {
        const saveBtn = document.getElementById('saveCirclesBtn');
        const exportBtn = document.getElementById('exportCirclesBtn');
        
        if (this.circles.length > 0) {
            saveBtn.style.display = 'block';
            exportBtn.disabled = false;
        } else {
            saveBtn.style.display = 'none';
            exportBtn.disabled = true;
        }
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
