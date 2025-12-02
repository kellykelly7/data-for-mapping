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
            ]
        }
    })
});

/* ----------------
    MOUSE EVENTS
------------------*/

// When mouse enters a point
map.on("mouseenter", "proj-points", () => {
    map.getCanvas().style.cursor = "pointer"; // Switch cursor to pointer
});

// When mouse leaves a point
map.on("mouseleave", "proj-points", () => {
    map.getCanvas().style.cursor = ""; // Switch pointer to cursor
});

map.on('click', 'proj-points', (e) => {
    const coordinates = e.features[0].geometry.coordinates
    const properties = e.features[0].properties;

    // move camera to clicked point
    map.flyTo({
        center: coordinates,
    });

    const buttonID = e.features[0].id

    const description = `
      <div>
        <h5>${e.features[0].properties.PROJECT_NAME}</h5>
        <p><strong>Project Number:</strong> ${e.features[0].properties.PROJECT_NUMBER}</p>
        <p><strong>Address:</strong> ${e.features[0].properties.ADDRESS}</p>
      </div>
    `;

    // create and show popup
    new mapboxgl.Popup() // declare new pop up on each click
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);

    
    const projInfoDiv = document.getElementById('proj_data');
    if (projInfoDiv) {
        projInfoDiv.innerHTML = '';

        const projname = `<p><strong>${properties.PROJECT_NAME}</strong></p>`;
        const projnum = `<p><strong>Project Number:</strong> ${properties.PROJECT_NUMBER || 'N/A'}</p>`;
        const address = `<p><strong>Address:</strong> ${properties.ADDRESS || 'N/A'}</p>`;
        
        const projtype = Array.isArray(properties['PROJECT_TYPE'])
            ? properties['PROJECT_TYPE'].join(', ')
            : properties['PROJECT_TYPE'] || 'N/A';
        
        const USIteam = Array.isArray(properties['USI_TEAM_MEMBERS'])
            ? properties['USI_TEAM_MEMBERS'].join(', ')
            : properties['USI_TEAM_MEMBERS'] || 'N/A';

        const PROJTYPE = `<p><strong>Project Type: </strong>${projtype}</p>`
        const usiteam = `<p><strong>USI Team Members: </strong>${USIteam}</p>`

        projInfoDiv.innerHTML = projname + projnum + address + PROJTYPE + usiteam;
        // make the project info panel visible when a point is clicked
        projInfoDiv.style.display = 'block';
        projInfoDiv.classList.add('visible');
    };
});

// Hide the project info panel when the user clicks on the map but not on a project point
map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['proj-points'] });
    if (!features || features.length === 0) {
        const projInfoDiv = document.getElementById('proj_data');
        if (projInfoDiv) {
            projInfoDiv.style.display = 'none';
            projInfoDiv.classList.remove('visible');
            projInfoDiv.innerHTML = '';
        }
    }
});

/* -----------------------------------
    BUTTON: RETURN TO FULL EXTENT
------------------------------------*/

document.getElementById('returnbutton').addEventListener('click', () => {
    map.jumpTo({
        center: [-79.357577, 43.721446], 
        zoom: 10.75,
        essential: true
    });
    
    // Close any open popups
    const popups = document.querySelectorAll('.mapboxgl-popup');
    popups.forEach(popup => popup.remove());
    
    // Clear the team member search selection
    const select = document.querySelector('.member_searchbar');
    if (select) {
        $(select).val('').trigger('change');
        $(select).select2('val', '');
    }
    
    // Remove filter to show all points
    map.setFilter('proj-points', null);
    
    // Hide the project info panel
    const projInfoDiv = document.getElementById('proj_data');
    if (projInfoDiv) {
        projInfoDiv.style.display = 'none';
        projInfoDiv.classList.remove('visible');
        projInfoDiv.innerHTML = '';
    }
});

/* -----------------------------------
    Search by Team Member
------------------------------------*/

$(document).ready(function() {
    $('.member_searchbar').select2();
});

$(function(){
    $('.member_searchbar').select2({
        placeholder: "Search for a team member (e.g., Leigh McGrath)"
    });

    $('.member_searchbar').on('change', function() {
        var selectedMem = $('.member_searchbar option:selected').text();
        $('#test').val(selectedMem);

        if (selectedMem == 'All') {
            map.setFilter(
                'proj-points', null);
        } else {
            map.setFilter(
                'proj-points',
                ['in', selectedMem, ['get', 'USI_TEAM_MEMBERS']]
            );
        }
    })
});