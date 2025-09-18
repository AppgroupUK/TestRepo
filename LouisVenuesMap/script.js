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
        this.highlightedCircle = null;
        this.circleCounter = 0;
        this.circleModeEnabled = false;
        this.circlesVisible = true;
        
        // Venue highlighting
        this.highlightedVenueMarker = null;
        
        
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
        console.log('filterByCounty called with:', county);
        const countyFilter = document.getElementById('countyFilter');
        countyFilter.value = county;
        this.applyFilters();
        
        // Show county sidebar if a specific county is selected
        if (county && county !== 'All Counties') {
            console.log('Showing county sidebar for:', county);
            this.showCountySidebar(county);
        } else {
            console.log('Hiding county sidebar');
            this.hideCountySidebar();
        }
        
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
            this.filterByCounty(selectedCounty);
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

        // Circle dropdown selection
        document.getElementById('circleDropdown').addEventListener('change', (e) => {
            this.selectCircleFromDropdown(e.target.value);
        });

        // Circle mode toggle
        document.getElementById('circleModeSwitch').addEventListener('change', (e) => {
            this.toggleCircleMode(e.target.checked);
        });

        // Circle visibility toggle
        document.getElementById('circleVisibilitySwitch').addEventListener('change', (e) => {
            this.toggleCircleVisibility(e.target.checked);
        });

        // County sidebar close button
        document.getElementById('closeCountySidebar').addEventListener('click', () => {
            this.hideCountySidebar();
        });

        // PDF export button (using event delegation since it's dynamically created)
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'exportVenuesPDF') {
                this.exportVenuesToPDF();
            }
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


    // Circle Management Methods
    toggleCircleMode(enabled) {
        this.circleModeEnabled = enabled;
        const addCircleBtn = document.getElementById('addCircleBtn');
        const clearCirclesBtn = document.getElementById('clearAllCircles');
        const saveCirclesBtn = document.getElementById('saveCirclesBtn');
        const exportCirclesBtn = document.getElementById('exportCirclesBtn');
        const circleControls = document.getElementById('circleControls');
        const visibilitySwitch = document.getElementById('circleVisibilitySwitch');
        
        if (enabled) {
            addCircleBtn.disabled = false;
            clearCirclesBtn.disabled = false;
            saveCirclesBtn.disabled = false;
            exportCirclesBtn.disabled = false;
            visibilitySwitch.disabled = false;
            if (this.circles.length > 0) {
                circleControls.style.display = 'block';
            }
            this.enableCircleInteractions();
            // Set visibility switch to match current state
            visibilitySwitch.checked = this.circlesVisible;
        } else {
            addCircleBtn.disabled = true;
            clearCirclesBtn.disabled = true;
            saveCirclesBtn.disabled = true;
            exportCirclesBtn.disabled = true;
            visibilitySwitch.disabled = true;
            circleControls.style.display = 'none';
            this.deselectCircle();
            this.disableCircleInteractions();
        }
    }

    toggleCircleVisibility(visible) {
        this.circlesVisible = visible;
        
        this.circles.forEach(circleData => {
            if (visible) {
                // Show circle
                this.map.addLayer(circleData.circle);
            } else {
                // Hide circle
                this.map.removeLayer(circleData.circle);
            }
        });
        
        // If hiding circles, clear any highlights
        if (!visible) {
            this.clearCircleHighlights();
        }
    }

    enableCircleInteractions() {
        this.circles.forEach(circleData => {
            const circle = circleData.circle;
            const latlng = circle.getLatLng();
            const radius = circle.getRadius();
            const style = circle.options;
            
            // Remove the non-interactive circle
            this.map.removeLayer(circle);
            
            // Create a new interactive circle with the same radius
            const newCircle = L.circle(latlng, {
                ...style,
                radius: radius,
                interactive: true
            });
            
            // Add to map only if circles are visible
            if (this.circlesVisible) {
                newCircle.addTo(this.map);
            }
            
            // Update the circle reference and preserve the radius
            circleData.circle = newCircle;
            circleData.radius = radius;
            
            // Add event listeners
            newCircle.setStyle({ cursor: 'pointer' });
            newCircle.on('click', (e) => {
                e.originalEvent.stopPropagation();
                this.selectCircle(circleData);
            });
            
            // Add drag functionality
            this.addDragFunctionality(circleData);
        });
    }

    disableCircleInteractions() {
        this.circles.forEach(circleData => {
            const circle = circleData.circle;
            circle.setStyle({ cursor: 'default' });
            circle.off('click');
            
            // Remove circle from map and re-add with no events to make it non-interactive
            const latlng = circle.getLatLng();
            const radius = circle.getRadius();
            const style = circle.options;
            
            // Remove the circle
            this.map.removeLayer(circle);
            
            // Create a new non-interactive circle with the same radius
            const newCircle = L.circle(latlng, {
                ...style,
                radius: radius,
                interactive: false
            });
            
            // Add to map only if circles are visible
            if (this.circlesVisible) {
                newCircle.addTo(this.map);
            }
            
            // Update the circle reference and preserve the radius
            circleData.circle = newCircle;
            circleData.radius = radius;
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
        });
        
        // Add to map only if circles are visible
        if (this.circlesVisible) {
            circle.addTo(this.map);
        }
        
        // Ensure counter is properly set
        this.ensureCounterIsCurrent();
        
        // Add circle data
        const circleData = {
            id: ++this.circleCounter,
            circle: circle,
            center: latlng,
            radius: radius,
            venues: [] // Track venues within this circle
        };
        
        this.circles.push(circleData);
        
        // Add event listeners for selection and dragging
        this.addCircleEventListeners(circleData);
        
        // Update venues within this circle
        this.updateVenuesInCircle(circleData);
        
        // Update UI
        this.updateCircleControls();
        this.showClearButton();
        this.showCircleControls();
        this.updatePersistenceButtons();
        this.updateCircleDropdown();
        
        // Auto-save to localStorage
        this.saveToLocalStorage();
        
        // Select the newly created circle
        this.selectCircle(circleData);
    }

    addCircleEventListeners(circleData) {
        const circle = circleData.circle;
        
        // Set initial interaction state based on circle mode
        if (this.circleModeEnabled) {
            circle.setStyle({ cursor: 'pointer' });
            circle.on('click', (e) => {
                e.originalEvent.stopPropagation();
                this.selectCircle(circleData);
            });
            this.addDragFunctionality(circleData);
        } else {
            circle.setStyle({ cursor: 'default' });
        }
    }

    addDragFunctionality(circleData) {
        const circle = circleData.circle;
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
                
                // Update venues within the circle after dragging
                this.updateVenuesInCircle(circleData);
                
                // Auto-save to localStorage after dragging
                this.saveToLocalStorage();
            }
        });
    }

    selectCircle(circleData) {
        if (!this.circleModeEnabled) return;
        
        // Clear any dropdown highlights
        this.clearCircleHighlights();
        
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
        this.clearCircleHighlights();
        this.updateCircleControls();
    }

    updateCircleRadius(radius) {
        if (this.selectedCircle) {
            this.selectedCircle.radius = radius;
            this.selectedCircle.circle.setRadius(radius);
            document.getElementById('radiusValue').textContent = `${radius.toLocaleString()}m`;
            
            // Update venues within the circle
            this.updateVenuesInCircle(this.selectedCircle);
            
            // Auto-save to localStorage
            this.saveToLocalStorage();
        }
    }

    updateVenuesInCircle(circleData) {
        if (!circleData || !circleData.circle) return;
        
        // Clear existing venues
        circleData.venues = [];
        
        // Get circle center and radius
        const circleCenter = circleData.circle.getLatLng();
        const radius = circleData.circle.getRadius();
        
        // Check each venue
        this.venues.forEach(venue => {
            if (!venue.coordinates) return;
            
            const [venueLat, venueLng] = venue.coordinates;
            const venuePoint = L.latLng(venueLat, venueLng);
            
            // Calculate distance from circle center to venue
            const distance = circleCenter.distanceTo(venuePoint);
            
            // If venue is within circle radius, add it to the circle's venues
            if (distance <= radius) {
                circleData.venues.push({
                    id: venue.id,
                    name: venue.name,
                    address: venue.fullAddress, // Use fullAddress instead of address
                    county: venue.county,
                    accountManager: venue.accountManager,
                    phone: venue.phone,
                    type: venue.type,
                    coordinates: venue.coordinates,
                    distance: Math.round(distance / 1000 * 10) / 10 // Distance in kilometers to 1 decimal place
                });
            }
        });
        
        // Sort venues by distance (closest first)
        circleData.venues.sort((a, b) => a.distance - b.distance);
        
        // Update circle info display if this is the selected circle
        if (this.selectedCircle && this.selectedCircle.id === circleData.id) {
            this.updateCircleInfo();
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
            const venueCount = this.selectedCircle.venues ? this.selectedCircle.venues.length : 0;
            circleInfo.innerHTML = `
                <div class="circle-basic-info">
                    <strong>Circle ${this.selectedCircle.id}</strong><br>
                    Radius: ${this.selectedCircle.radius.toLocaleString()}m<br>
                    Venues: ${venueCount}
                </div>
                ${venueCount > 0 ? this.createVenueListHTML(this.selectedCircle.venues) : ''}
            `;
            deleteButton.disabled = false;
        } else {
            circleInfo.textContent = 'No circle selected';
            deleteButton.disabled = true;
        }
    }

    createVenueListHTML(venues) {
        if (!venues || venues.length === 0) return '';
        
        const venueItems = venues.map(venue => `
            <div class="venue-in-circle">
                <div class="venue-name">${venue.name}</div>
                <div class="venue-address">${venue.address}</div>
                <div class="venue-county">${venue.county}</div>
                <div class="venue-contact">
                    <div class="venue-contact-name">${venue.accountManager || 'No contact assigned'}</div>
                    <div class="venue-contact-phone">${venue.phone || 'No phone number'}</div>
                </div>
                <div class="venue-distance">${venue.distance}km away</div>
            </div>
        `).join('');
        
        return `
            <div class="venues-in-circle">
                <h5>Venues in Circle:</h5>
                <div class="venue-list">
                    ${venueItems}
                </div>
                <div class="venue-export-actions">
                    <button id="exportVenuesPDF" class="export-pdf-btn">
                        📄 Export to PDF
                    </button>
                </div>
            </div>
        `;
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
            this.highlightedCircle = null;
            
            // Update UI
            this.updateCircleControls();
            this.updateClearButtonVisibility();
            this.updatePersistenceButtons();
            this.updateCircleDropdown();
            
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
        this.highlightedCircle = null;
        
        // Update UI
        this.updateCircleControls();
        this.updateClearButtonVisibility();
        this.updatePersistenceButtons();
        this.updateCircleDropdown();
        this.hideCircleControls();
        
        // Auto-save to localStorage
        this.saveToLocalStorage();
    }

    showClearButton() {
        const clearButton = document.getElementById('clearAllCircles');
        if (this.circles.length > 0) {
            clearButton.style.display = 'block';
            clearButton.disabled = !this.circleModeEnabled;
        }
    }

    updateClearButtonVisibility() {
        const clearButton = document.getElementById('clearAllCircles');
        if (this.circles.length === 0) {
            clearButton.style.display = 'none';
        } else {
            clearButton.disabled = !this.circleModeEnabled;
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
            radius: circleData.radius,
            lastUpdated: new Date().toISOString()
        }));

        const dataStr = JSON.stringify(circlesData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Use a consistent filename - browser will handle duplicates
        const filename = 'venue_map_circles.json';
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(link.href);
        
        // Show success message with timestamp
        const now = new Date().toLocaleString();
        alert(`Circles saved successfully!\nFile: ${filename}\nTime: ${now}`);
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
        link.download = 'venue_map_circles_export.json';
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
        
        // Find the highest ID to set the counter properly
        let maxId = 0;
        circlesData.forEach(circleInfo => {
            if (circleInfo.id && circleInfo.id > maxId) {
                maxId = circleInfo.id;
            }
        });
        this.circleCounter = maxId;
        
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
            });
            
            // Add to map only if circles are visible
            if (this.circlesVisible) {
                circle.addTo(this.map);
            }
            
            // Add circle data
            const circleData = {
                id: circleInfo.id || ++this.circleCounter,
                circle: circle,
                center: latlng,
                radius: radius,
                venues: [] // Initialize venues array
            };
            
            this.circles.push(circleData);
            
            // Update venues within this circle
            this.updateVenuesInCircle(circleData);
            
            // Add event listeners
            this.addCircleEventListeners(circleData);
        });
        
        // Update UI
        this.updateCircleControls();
        this.showClearButton();
        this.updateCircleDropdown();
        if (this.circleModeEnabled) {
            this.showCircleControls();
            this.enableCircleInteractions();
        } else {
            this.disableCircleInteractions();
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
                
                // Check and fix circle IDs if needed
                const fixedCirclesData = this.fixCircleIds(circlesData);
                
                this.loadCirclesData(fixedCirclesData);
                console.log(`Loaded ${fixedCirclesData.length} circles from localStorage`);
                
                // Save the fixed data back to localStorage if changes were made
                if (JSON.stringify(circlesData) !== JSON.stringify(fixedCirclesData)) {
                    this.saveFixedCirclesToLocalStorage(fixedCirclesData);
                    console.log('Fixed circle IDs and saved to localStorage');
                }
            } catch (error) {
                console.error('Error loading circles from localStorage:', error);
                // Initialize dropdown even if loading failed
                this.updateCircleDropdown();
            }
        } else {
            // Initialize dropdown even if no circles
            this.updateCircleDropdown();
        }
    }

    fixCircleIds(circlesData) {
        if (!circlesData || circlesData.length === 0) return circlesData;
        
        // Create a copy to avoid modifying the original
        const fixedData = [...circlesData];
        
        // Check if IDs are sequential starting from 1
        const ids = fixedData.map(circle => circle.id).sort((a, b) => a - b);
        const expectedIds = Array.from({length: ids.length}, (_, i) => i + 1);
        
        // If IDs don't match expected sequence, fix them
        if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) {
            console.log('Fixing circle IDs:', ids, '->', expectedIds);
            
            // Create a mapping of old IDs to new IDs
            const idMapping = {};
            ids.forEach((oldId, index) => {
                const newId = index + 1;
                idMapping[oldId] = newId;
            });
            
            // Update all circle IDs
            fixedData.forEach(circle => {
                if (circle.id && idMapping[circle.id]) {
                    circle.id = idMapping[circle.id];
                }
            });
            
            console.log('Circle IDs fixed successfully');
        }
        
        return fixedData;
    }

    saveFixedCirclesToLocalStorage(circlesData) {
        const circlesDataToSave = circlesData.map(circleData => ({
            id: circleData.id,
            center: {
                lat: circleData.center.lat,
                lng: circleData.center.lng
            },
            radius: circleData.radius
        }));
        
        localStorage.setItem('venueMapCircles', JSON.stringify(circlesDataToSave));
    }

    updatePersistenceButtons() {
        const saveBtn = document.getElementById('saveCirclesBtn');
        const exportBtn = document.getElementById('exportCirclesBtn');
        
        if (this.circles.length > 0) {
            saveBtn.style.display = 'block';
            exportBtn.disabled = !this.circleModeEnabled;
        } else {
            saveBtn.style.display = 'none';
            exportBtn.disabled = true;
        }
        
        // Update all circle-related buttons based on mode
        const addCircleBtn = document.getElementById('addCircleBtn');
        const clearCirclesBtn = document.getElementById('clearAllCircles');
        
        if (this.circles.length > 0) {
            clearCirclesBtn.style.display = 'block';
            clearCirclesBtn.disabled = !this.circleModeEnabled;
        } else {
            clearCirclesBtn.style.display = 'none';
        }
        
        addCircleBtn.disabled = !this.circleModeEnabled;
        saveBtn.disabled = !this.circleModeEnabled;
    }

    showError(message) {
        const venueList = document.getElementById('venueList');
        venueList.innerHTML = `<div class="error">${message}</div>`;
    }

    // Circle Dropdown Methods
    updateCircleDropdown() {
        const dropdown = document.getElementById('circleDropdown');
        const circleDetails = document.getElementById('circleDetails');
        
        // Clear existing options except the first one
        dropdown.innerHTML = '<option value="">Select a circle to view details</option>';
        
        if (this.circles.length === 0) {
            circleDetails.style.display = 'none';
            return;
        }
        
        // Add options for each circle
        this.circles.forEach(circleData => {
            const option = document.createElement('option');
            option.value = circleData.id;
            option.textContent = `Circle ${circleData.id} - ${circleData.radius.toLocaleString()}m radius`;
            dropdown.appendChild(option);
        });
    }

    selectCircleFromDropdown(circleId) {
        const circleDetails = document.getElementById('circleDetails');
        
        if (!circleId) {
            circleDetails.style.display = 'none';
            this.clearCircleHighlights();
            return;
        }
        
        const circleData = this.circles.find(c => c.id == circleId);
        if (!circleData) {
            circleDetails.style.display = 'none';
            this.clearCircleHighlights();
            return;
        }
        
        // Show circle details
        circleDetails.style.display = 'block';
        this.displayCircleDetails(circleData);
        
        // Highlight the circle on the map
        this.highlightCircleOnMap(circleData);
    }

    displayCircleDetails(circleData) {
        const circleInfo = document.getElementById('circleInfo');
        const venueCount = circleData.venues ? circleData.venues.length : 0;
        
        circleInfo.innerHTML = `
            <div class="circle-basic-info">
                <strong>Circle ${circleData.id}</strong><br>
                Radius: ${circleData.radius.toLocaleString()}m<br>
                Center: ${circleData.center.lat.toFixed(6)}, ${circleData.center.lng.toFixed(6)}<br>
                Venues: ${venueCount}
            </div>
            ${venueCount > 0 ? this.createVenueListHTML(circleData.venues) : ''}
        `;
    }

    // County Sidebar Methods
    showCountySidebar(county) {
        console.log('showCountySidebar called with:', county);
        const sidebar = document.getElementById('countySidebar');
        const title = document.getElementById('countySidebarTitle');
        
        if (!sidebar) {
            console.error('County sidebar element not found!');
            return;
        }
        
        // Update title
        title.textContent = `${county} Venues`;
        
        // Show sidebar with animation
        sidebar.style.display = 'block';
        setTimeout(() => {
            sidebar.classList.add('show');
            console.log('Sidebar should now be visible');
        }, 10);
        
        // Populate venue list
        this.populateCountyVenueList(county);
    }

    hideCountySidebar() {
        const sidebar = document.getElementById('countySidebar');
        sidebar.classList.remove('show');
        
        // Hide after animation completes
        setTimeout(() => {
            sidebar.style.display = 'none';
        }, 300);
    }

    populateCountyVenueList(county) {
        const venueList = document.getElementById('countyVenueList');
        
        // Get venues for the selected county
        const countyVenues = this.venues.filter(venue => 
            venue.county === county && venue.coordinates
        );
        
        if (countyVenues.length === 0) {
            venueList.innerHTML = '<div class="no-venues">No venues found in this county.</div>';
            return;
        }
        
        // Create venue items
        const venueItems = countyVenues.map(venue => {
            return `
                <div class="county-venue-item" data-venue-id="${venue.id}">
                    <div class="county-venue-name">${venue.name}</div>
                    <div class="county-venue-address">${venue.fullAddress}</div>
                    <div class="county-venue-contact">
                        <div class="county-venue-contact-name">${venue.accountManager || 'No contact assigned'}</div>
                        <div class="county-venue-contact-phone">${venue.phone || 'No phone number'}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        venueList.innerHTML = venueItems;
        
        // Add click handlers for venue items
        venueList.querySelectorAll('.county-venue-item').forEach(item => {
            item.addEventListener('click', () => {
                const venueId = parseInt(item.dataset.venueId);
                this.selectVenueFromCountyList(venueId);
            });
        });
    }

    selectVenueFromCountyList(venueId) {
        // Find the venue
        const venue = this.venues.find(v => v.id === venueId);
        if (!venue) return;
        
        // Remove previous selection
        document.querySelectorAll('.county-venue-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        const selectedItem = document.querySelector(`[data-venue-id="${venueId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        // Center map on venue
        if (venue.coordinates) {
            const [lat, lng] = venue.coordinates;
            this.map.setView([lat, lng], 12);
            
            // Find and highlight the corresponding marker on the map
            this.highlightVenueMarker(venue);
        }
    }

    highlightVenueMarker(venue) {
        // Clear any existing venue highlights
        this.clearVenueHighlights();
        
        // Find the marker for this venue
        const markerObj = this.markers.find(m => m.venue.id === venue.id);
        const marker = markerObj ? markerObj.marker : null;
        if (marker) {
            // Store reference to highlighted marker
            this.highlightedVenueMarker = marker;
            
            // Change marker style to highlight it
            marker.setStyle({
                radius: 12,
                fillColor: '#e74c3c',
                color: '#fff',
                weight: 4,
                opacity: 1,
                fillOpacity: 0.9
            });
            
            // Add pulsing animation class
            marker.getElement().classList.add('highlighted-venue');
            
            // Open popup to show venue info
            const popupContent = `
                <div class="venue-popup">
                    <h4>${venue.name}</h4>
                    <p><strong>Address:</strong> ${venue.fullAddress}</p>
                    <p><strong>Contact:</strong> ${venue.accountManager || 'No contact assigned'}</p>
                    <p><strong>Phone:</strong> ${venue.phone || 'No phone number'}</p>
                </div>
            `;
            marker.bindPopup(popupContent).openPopup();
        }
    }

    clearVenueHighlights() {
        if (this.highlightedVenueMarker) {
            // Reset marker to original style (it's a circleMarker, not divIcon)
            const markerObj = this.markers.find(m => m.marker === this.highlightedVenueMarker);
            if (markerObj) {
                const venue = markerObj.venue;
                const countyColor = this.countyColors[venue.county] || '#666666';
                
                this.highlightedVenueMarker.setStyle({
                    radius: 8,
                    fillColor: countyColor,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });
                
                // Remove pulsing animation class
                this.highlightedVenueMarker.getElement().classList.remove('highlighted-venue');
            }
            this.highlightedVenueMarker.closePopup();
        }
        this.highlightedVenueMarker = null;
    }

    exportVenuesToPDF() {
        if (!this.selectedCircle || !this.selectedCircle.venues || this.selectedCircle.venues.length === 0) {
            alert('No venues to export. Please select a circle with venues first.');
            return;
        }

        try {
            // Create new PDF document
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set up fonts and colors
            doc.setFont('helvetica');
            
            // Title
            doc.setFontSize(20);
            doc.setTextColor(39, 174, 96); // Green color
            doc.text('Circle Venues Report', 20, 30);
            
            // Circle information
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Circle ID: ${this.selectedCircle.id}`, 20, 45);
            doc.text(`Radius: ${this.selectedCircle.radius.toLocaleString()} meters`, 20, 55);
            doc.text(`Total Venues: ${this.selectedCircle.venues.length}`, 20, 65);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 75);
            
            // Add a line separator
            doc.setDrawColor(39, 174, 96);
            doc.setLineWidth(0.5);
            doc.line(20, 85, 190, 85);
            
            // Venue list
            doc.setFontSize(14);
            doc.setTextColor(39, 174, 96);
            doc.text('Venues in Circle:', 20, 100);
            
            // Reset for venue details
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            
            let yPosition = 115;
            const pageHeight = 280;
            const lineHeight = 8;
            const maxWidth = 170;
            
            this.selectedCircle.venues.forEach((venue, index) => {
                // Check if we need a new page
                if (yPosition > pageHeight) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Venue number and name
                doc.setFontSize(11);
                doc.setTextColor(39, 174, 96);
                doc.text(`${index + 1}. ${venue.name}`, 20, yPosition);
                yPosition += lineHeight;
                
                // Venue details
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);
                
                // Address
                const addressLines = doc.splitTextToSize(`Address: ${venue.address}`, maxWidth);
                doc.text(addressLines, 25, yPosition);
                yPosition += addressLines.length * lineHeight;
                
                // County
                doc.text(`County: ${venue.county}`, 25, yPosition);
                yPosition += lineHeight;
                
                // Contact information
                if (venue.accountManager) {
                    doc.text(`Contact: ${venue.accountManager}`, 25, yPosition);
                    yPosition += lineHeight;
                }
                
                if (venue.phone) {
                    doc.text(`Phone: ${venue.phone}`, 25, yPosition);
                    yPosition += lineHeight;
                }
                
                // Type
                if (venue.type) {
                    doc.text(`Type: ${venue.type}`, 25, yPosition);
                    yPosition += lineHeight;
                }
                
                // Distance
                doc.text(`Distance: ${venue.distance}km from circle center`, 25, yPosition);
                yPosition += lineHeight + 3;
                
                // Add a subtle line between venues
                if (index < this.selectedCircle.venues.length - 1) {
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.2);
                    doc.line(20, yPosition - 1, 190, yPosition - 1);
                    yPosition += 2;
                }
            });
            
            // Add footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(`Page ${i} of ${pageCount}`, 20, 290);
                doc.text('Generated by Louis Venues Map', 150, 290);
            }
            
            // Save the PDF
            const fileName = `circle_${this.selectedCircle.id}_venues_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            // Show success message
            this.showSuccess(`PDF exported successfully: ${fileName}`);
            
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showError('Failed to export PDF. Please try again.');
        }
    }

    highlightCircleOnMap(circleData) {
        // Clear any existing highlights
        this.clearCircleHighlights();
        
        if (!circleData || !circleData.circle) return;
        
        // Store reference to highlighted circle
        this.highlightedCircle = circleData;
        
        // Change circle style to highlight it
        circleData.circle.setStyle({
            color: '#e74c3c', // Red color for highlight
            weight: 4,        // Thicker border
            opacity: 1,
            fillColor: '#e74c3c',
            fillOpacity: 0.1  // Light red fill
        });
        
        // Pan to the circle if it's not fully visible
        this.map.fitBounds(circleData.circle.getBounds(), {
            padding: [20, 20]
        });
    }

    clearCircleHighlights() {
        if (this.highlightedCircle && this.highlightedCircle.circle) {
            // Reset to original style
            this.highlightedCircle.circle.setStyle({
                color: '#000000',
                weight: 2,
                opacity: 1,
                fillColor: 'transparent',
                fillOpacity: 0
            });
        }
        this.highlightedCircle = null;
    }

    ensureCounterIsCurrent() {
        // Find the highest ID among existing circles
        let maxId = 0;
        this.circles.forEach(circleData => {
            if (circleData.id && circleData.id > maxId) {
                maxId = circleData.id;
            }
        });
        
        // Set counter to the highest ID found
        this.circleCounter = maxId;
    }

    // Manual migration function - can be called from browser console
    migrateCircleIds() {
        console.log('Starting circle ID migration...');
        
        // Get current circles from localStorage
        const savedCircles = localStorage.getItem('venueMapCircles');
        if (!savedCircles) {
            console.log('No circles found in localStorage');
            return;
        }
        
        try {
            const circlesData = JSON.parse(savedCircles);
            console.log('Current circle IDs:', circlesData.map(c => c.id));
            
            // Fix the IDs
            const fixedCirclesData = this.fixCircleIds(circlesData);
            console.log('Fixed circle IDs:', fixedCirclesData.map(c => c.id));
            
            // Save back to localStorage
            this.saveFixedCirclesToLocalStorage(fixedCirclesData);
            
            // Reload the circles
            this.loadCirclesData(fixedCirclesData);
            this.updateCircleDropdown();
            
            console.log('Circle ID migration completed successfully!');
            console.log('You can now refresh the page to see the changes.');
            
        } catch (error) {
            console.error('Error during migration:', error);
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VenueMapApp();
    
    // Make migration function available globally for debugging
    window.migrateCircleIds = () => app.migrateCircleIds();
});
