mapboxgl.accessToken = 'pk.eyJ1Ijoia2VsbHlrZWxseTciLCJhIjoiY202aWNjdDE5MDcwbTJrcHppYWw5ZjJzcCJ9.pry2p-gu8qXteiF0TWa4dw'

const map = new mapboxgl.Map({
    container: 'basemap',
    projection: 'mercator',
    style: 'mapbox://styles/kellykelly7/cmiexrzr9005n01qteivxh01o',
    center: [-79.357577, 43.721446],
    zoom: 9.75
})

// Add navigation and fullscreen controls
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());

map.on('load', () => {
    map.addSource('proj-data', {
        type: 'geojson', 
        data: 'USI_projects.geojson'
    })

    map.addLayer({
        id: 'proj-points',
        type: 'circle',
        source: 'proj-data',
        paint: {
            'circle-radius': 3,
            'circle-color': ['match',
                ['get', 'PROJECT_END_YEAR'],
                'Ongoing', '#FFFF00',
                'N/A', '#000000',
                /* other */ '#008000'
            ]
        }
    })
});

// When mouse enters a point
map.on("mouseenter", "show-pts", () => {
    map.getCanvas().style.cursor = "pointer"; // Switch cursor to pointer
});

// When mouse leaves a point
map.on("mouseleave", "show-pts", () => {
    map.getCanvas().style.cursor = ""; // Switch pointer to cursor
});