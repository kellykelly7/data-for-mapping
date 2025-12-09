// insert personal mapbox token -- currently using mine (Kelly) but will need to be updated by a company-wide account or something
// maybe there's one designated person or account managed by USI that has a token for running the map
mapboxgl.accessToken = 'pk.eyJ1Ijoia2VsbHlrZWxseTciLCJhIjoiY202aWNjdDE5MDcwbTJrcHppYWw5ZjJzcCJ9.pry2p-gu8qXteiF0TWa4dw'

// create a new map variable constant
const map = new mapboxgl.Map({
    // container for adding into the index.html page
    container: 'map',
    // set projection (CRS) for web map
    projection: 'mercator',
    // style code sets the base map -- presently streets with Toronto's neighbourhoods polygon
    style: 'mapbox://styles/kellykelly7/cmiexrzr9005n01qteivxh01o',
    // center of the map -- this is the centerpoint of the desired location
    // might change to world map, so will need to change this set of coordinates too
    center: [-79.357577, 43.721446],
    // zoom level appropriate for Toronto, but will need to revert to 1 or 1.2 for world map
    zoom: 10.75
})

// Create geocoder as a variable
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
});

// Append geocoder variable to geocoder HTML div to position on page
document.getElementById("geocoder").appendChild(geocoder.onAdd(map));

// Add navigation and fullscreen controls
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());
map.scrollZoom.enable();
map.boxZoom.enable();
map.dragPan.enable();
map.dragRotate.enable();
map.keyboard.enable();
map.doubleClickZoom.enable();
map.touchZoomRotate.enable();


// add data source when it first loads onto the screen
map.on('load', () => {
    map.addSource('proj-data', {
        type: 'geojson', 
        // geojson file in folder -- with github, can directly link to this line, not raw file
        data: 'USI_projects.geojson'
    })

    // new map layer for the points from newly added data source
    map.addLayer({
        id: 'proj-points',
        type: 'circle',
        source: 'proj-data',
        // styling of the data visualization
        paint: {
            'circle-radius': 5,
            // set colour of circles based on project completion status
            'circle-color': ['match',
                ['get', 'PROJECT_END_YEAR'],
                'Ongoing', '#FFFF00',
                'N/A', '#000000',
                /* other */ '#008000'
            ],
            // set colour and width of circle borders
            'circle-stroke-color': '#000000',
            'circle-stroke-width': 1
        }
    })

    /* ===================================================
        Attach Filter Handlers (after layer is created)
    ===================================================*/
    
    // Team Member Search
    $('.member_searchbar').select2({
        placeholder: "Search for a team member (e.g., Leigh McGrath)"
    });

    // convert selected option to text and store in activeFilters for combined filtering
    $('.member_searchbar').on('change', function() {
        var selectedMem = $('.member_searchbar option:selected').text();
        activeFilters.member = selectedMem;
        console.log('Member filter updated:', selectedMem);
        applyFilter();
    });

    $('.client_searchbar').select2({
        placeholder: "Search for a client name (e.g., Oxford Properties)"
    });

    $('.client_searchbar').on('change', function() {
        var selectedClient = $('.client_searchbar option:selected').text();
        activeFilters.client = selectedClient;
        console.log('Client filter updated:', selectedClient);
        applyFilter();
    });

    // Project Number Search
    $('.project_number_input').on('input', function() {
        var projectNumber = $(this).val().trim();
        activeFilters.projectNumber = projectNumber || null;
        console.log('Project number filter:', projectNumber);
        applyFilter();
    });

    // Project Type Filter and combine with other filters
    const getProjType = document.getElementById('proj_type');
    if (getProjType) {
        getProjType.addEventListener('change', (e) => {
            activeFilters.projType = e.target.value || null;
            console.log('Project type filter:', e.target.value);
            applyFilter();
        });
    }

    // Project End Year Search and combine with other filters
    $('.project_EY_input').on('input', function() {
        var projectEY = $(this).val().trim();
        activeFilters.projectEY = projectEY || null;
        console.log('Project EY filter:', projectEY);
        applyFilter();
    });

    // Project Start Year Search and combine with other filters
    $('.project_SY_input').on('input', function() {
        var projectSY = $(this).val().trim();
        activeFilters.projectSY = projectSY || null;
        console.log('Project SY filter:', projectSY);
        applyFilter();
    });

    /* =====================================
        Initialize Legend (inside load event)
    ======================================*/
    
    // create legend variable and dictionary for labels and colours
    const legend = document.getElementById('legend');
    const legendLabels = [
        {label: 'Ongoing Projects', color: '#FFFF00'},
        {label: 'Completed Projects', color: '#008000'},
        {label: 'N/A End Year', color: '#000000'}
    ];

    // loop through labels and create legend items for each
    legendLabels.forEach((item) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const circle = document.createElement('div');
        circle.className = 'legend-circle';
        circle.style.backgroundColor = item.color;
        circle.style.width = '14px';
        circle.style.height = '14px';
        circle.style.display = 'inline-block';
        circle.style.marginRight = '8px';
        circle.style.verticalAlign = 'middle';
        
        const label = document.createElement('span');
        label.textContent = item.label;

        // add items to legend
        legendItem.appendChild(circle);
        legendItem.appendChild(label);
        legend.appendChild(legendItem);
    });

    /* =====================================
        Mouse Events (inside load event)
    ======================================*/

    // When mouse enters a point
    map.on("mouseenter", "proj-points", () => {
        map.getCanvas().style.cursor = "pointer";
    });

    // When mouse leaves a point
    map.on("mouseleave", "proj-points", () => {
        map.getCanvas().style.cursor = "";
    });

    // when point is clicked fly to and zoom in on it and populate project info panel and popup
    map.on('click', 'proj-points', (e) => {
        const coordinates = e.features[0].geometry.coordinates
        const properties = e.features[0].properties;

        // fly to preset coordinates from geojson, and zoom level 14
        map.flyTo({
            center: coordinates,
            zoom: 14
        });

        // create dynamic desccription for popup
        const description = `
          <div>
            <h3>${e.features[0].properties.PROJECT_NAME}</h3>
            <p><strong>Project Number:</strong> ${e.features[0].properties.PROJECT_NUMBER}</p>
            <p><strong>Address:</strong> ${e.features[0].properties.ADDRESS}</p>
          </div>
        `;

        // create the popup at clicked point
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);

        // dynamically populate project info panel (bottom right) with relevant project info
        const projInfoDiv = document.getElementById('proj_data');
        if (projInfoDiv) {
            projInfoDiv.innerHTML = '';

            const projname = `<p class="proj-name">${properties.PROJECT_NAME || 'N/A'}</p>`;
            const projnum = `<p><span class="label">Project Number:</span> ${properties.PROJECT_NUMBER || 'N/A'}</p>`;
            const address = `<p><span class="label">Address:</span> ${properties.ADDRESS || 'N/A'}</p>`;
            
            // Helper function to safely convert arrays/strings to comma-separated text
            const toText = (val) => {
                console.log('toText input:', val, typeof val);
                if (!val) return 'N/A';
                
                // If it's a string that looks like JSON array, parse it
                if (typeof val === 'string') {
                    const trimmed = val.trim();
                    if (trimmed.startsWith('[')) {
                        try {
                            const parsed = JSON.parse(trimmed);
                            if (Array.isArray(parsed)) {
                                return parsed.filter(v => v && v.toString().trim()).join(', ');
                            }
                        } catch (e) {
                            console.warn('Failed to parse JSON:', trimmed, e);
                        }
                    }
                    // Not JSON, just return the string
                    return trimmed || 'N/A';
                }
                
                // If it's already an array, join it
                if (Array.isArray(val)) {
                    return val.filter(v => v && v.toString().trim()).join(', ');
                }
                
                return String(val);
            };
            
            // process possible array fields into text for clean presentation
            const projtype = toText(properties['PROJECT_TYPE']);
            const cliName = toText(properties['CLIENT_NAME']);
            const cliType = toText(properties['CLIENT_TYPE']);
            const USIteam = toText(properties['USI_TEAM_MEMBERS']);
            const bylawnum = toText(properties['BY_LAW_NUM']);
            
            // debug in DevTools console (F12)
            console.log('projtype:', projtype);
            console.log('cliName:', cliName);
            console.log('cliType:', cliType);
            console.log('USIteam:', USIteam);
            console.log('bylawnum:', bylawnum);
            
            // create HTML segments for each field
            const PROJTYPE = `<p><span class="label">Project Type:</span> ${projtype}</p>`
            const clientName = `<p><span class="label">Client Name(s):</span> ${cliName}</p>`
            const clientType = `<p><span class="label">Client Type:</span> ${cliType}</p>`
            const usiteam = `<p><span class="label">USI Team Members:</span> ${USIteam}</p>`
            const bylaw = `<p><span class="label">By-law Number(s):</span> ${bylawnum}</p>`

            // insert info into div and make visible
            projInfoDiv.innerHTML = projname + projnum + address + PROJTYPE + clientName + clientType + usiteam + bylaw;
            projInfoDiv.style.display = 'block';
            projInfoDiv.classList.add('visible');
            
            // Hide legend when a project is selected
            const legendEl = document.getElementById('legend');
            if (legendEl) {
                legendEl.style.display = 'none';
            }
        }
    });

    // Hide the project info panel when clicking on the map but not on a project point
    map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['proj-points'] });
        if (!features || features.length === 0) {
            const projInfoDiv = document.getElementById('proj_data');
            if (projInfoDiv) {
                projInfoDiv.style.display = 'none';
                projInfoDiv.classList.remove('visible');
                projInfoDiv.innerHTML = '';
            }
            // Show legend when no project is selected
            const legendEl = document.getElementById('legend');
            if (legendEl) {
                legendEl.style.display = 'block';
            }
        }
    });
});

/* ==================================
    BUTTON: RETURN TO FULL EXTENT
======================================*/

// create button to respond to click event
document.getElementById('returnbutton').addEventListener('click', () => {
    // fly back to full extent and center coordinates    
    map.jumpTo({
        center: [-79.357577, 43.721446], 
        zoom: 10.75,
        essential: true
    });
    
    // Close any open popups
    const popups = document.querySelectorAll('.mapboxgl-popup');
    popups.forEach(popup => popup.remove());
    
    // Reset all filter values
    activeFilters.member = null;
    activeFilters.projectNumber = null;
    activeFilters.projType = null;
    activeFilters.projectEY = null;
    activeFilters.projectSY = null;
    activeFilters.clientName = null;
    console.log('Active filters reset:', activeFilters);
    
    // Clear form inputs and update Select2 UI
    const select = document.querySelector('.member_searchbar');
    if (select) {
        // set value to null and trigger change so Select2 updates its displayed value
        $(select).val(null).trigger('change');
    }
    
    const clientSelect = document.querySelector('.client_searchbar');
    if (clientSelect) {
        // set value to null and trigger change so display value is updated
        $(clientSelect).val(null).trigger('change');
    }
    
    // clear selection
    const projTypeEl = document.getElementById('proj_type');
    if (projTypeEl) {
        projTypeEl.value = '';
    }
    
    // clear input
    const projNumInput = document.querySelector('.project_number_input');
    if (projNumInput) {
        projNumInput.value = '';
    }
    
    // clear input
    const projEYInput = document.querySelector('.project_EY_input');
    if (projEYInput) {
        projEYInput.value = '';
    }

    // clear input
    const projSYInput = document.querySelector('.project_SY_input');
    if (projSYInput) {
        projSYInput.value = '';
    }
    
    // Directly set filter to null to show all points
    if (map.getLayer('proj-points')) {
        map.setFilter('proj-points', null);
        console.log('Layer filter set to null - all points should be visible');
    } else {
        console.warn('Layer proj-points does not exist');
    }
    
    // Hide the project info panel
    const projInfoDiv = document.getElementById('proj_data');
    if (projInfoDiv) {
        projInfoDiv.style.display = 'none';
        projInfoDiv.classList.remove('visible');
        projInfoDiv.innerHTML = '';
    }
    
    // Show the legend
    const legendEl = document.getElementById('legend');
    if (legendEl) {
        legendEl.style.display = 'block';
    }
});

/* ==========================================
    Combine filters to narrow down results
=============================================*/

// Store active filter values
let activeFilters = {
    member: null,
    projectNumber: null,
    projType: null,
    projectEY: null,
    projectSY: null,
    clientName: null
};

// Build combined filter from all active filters
function buildCombinedFilter() {
    const filters = [];
    
    // Add member filter if active
    // Check if the selected member value appears in the USI_TEAM_MEMBERS array
    if (activeFilters.member && activeFilters.member !== 'All') {
        filters.push(['in', activeFilters.member, ['get', 'USI_TEAM_MEMBERS']]);
    }
    
    if (activeFilters.clientName && activeFilters.clientName !== 'All') {
        filters.push(['in', activeFilters.clientName, ['get', 'CLIENT_NAME']]);
    }

    // Add project number filter if active
    if (activeFilters.projectNumber) {
        filters.push(['==', ['to-string', ['get', 'PROJECT_NUMBER']], activeFilters.projectNumber]);
    }
    
    // Add project type filter if active
    // Check if the selected type appears in the PROJECT_TYPE array
    if (activeFilters.projType && activeFilters.projType !== 'All') {
        filters.push(['in', activeFilters.projType, ['get', 'PROJECT_TYPE']]);
    }
    
    // Add project end year filter if active
    if (activeFilters.projectEY) {
        filters.push(['==', ['get', 'PROJECT_END_YEAR'], activeFilters.projectEY]);
    }
    
    // Add project start year filter if active
    if (activeFilters.projectSY) {
        filters.push(['==', ['get', 'PROJECT_START_YEAR'], activeFilters.projectSY])
    }

    // If no filters, return null (show all)
    if (filters.length === 0) {
        return null;
    }
    
    // If one filter, return it directly
    if (filters.length === 1) {
        return filters[0];
    }
    
    // If multiple filters, combine with 'all' (AND logic)
    return ['all', ...filters];
}

// Apply the combined filter to the map
function applyFilter() {
    const combinedFilter = buildCombinedFilter();
    console.log('Applying combined filter:', combinedFilter);
    
    // Use null to show all features, or the filter expression
    if (combinedFilter === null) {
        map.setFilter('proj-points', null);
    } else {
        map.setFilter('proj-points', combinedFilter);
    }
}
