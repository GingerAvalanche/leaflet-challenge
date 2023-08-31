const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
const colors = [
    "rgb(91, 255, 99)",
    "rgb(146, 237, 47)",
    "rgb(182, 217, 0)",
    "rgb(210, 195, 0)",
    "rgb(233, 171, 0)",
    "rgb(250, 145, 0)",
    "rgb(255, 117, 11)",
    "rgb(255, 87, 50)",
    "rgb(255, 53, 77)",
    "rgb(255, 0, 102)"
]
let steps = [0,0,0,0,0,0,0,0,0]

d3.json(url).then(data => createFeatures(data));

function createFeatures(earthquakeData) {
    let depths = earthquakeData.features.map(f => f.geometry.coordinates[2]).sort((a, b) => a - b);
    let mean = depths.reduce((agg, d) => agg + d, 0) / depths.length;
    let maxDepth = depths[depths.length - 1];
    let minDepth = depths[0];
    let stepSize = 0;
    if (maxDepth - mean < minDepth + mean) {
        stepSize = Math.round((maxDepth - mean) / 5);
        for (let x = 0; x < steps.length; ++x) {
            steps[10 - x] = Math.ceil(maxDepth - stepSize * (x + 1))
        }
    }
    else {
        stepSize = Math.round((minDepth + mean) / 5);
        for (let x = 0; x < steps.length; ++x) {
            steps[x] = Math.floor(minDepth + stepSize * (x + 1))
        }
    }

    function depthToColor(depth) {
        for (let x = 0; x < steps.length; ++x) {
            if (depth < steps[x]) {
                return colors[x];
            }
        }
        return colors[9];
    }

    let earthquakes = earthquakeData.features.map(element =>
        L.geoJSON(element, {
            pointToLayer: (feature, latlng) => L.circle(latlng, {radius: feature.properties.mag * 5000}),
            style: (feature) => { return { stroke: false, fillOpacity: 0.7, fillColor: depthToColor(feature.geometry.coordinates[2]) }; }
        }).bindPopup(`<div><b>Title:</b> ${element.properties.title}<br><b>Time:</b> ${new Date(element.properties.time)}<br><b>Location:</b> [${element.geometry.coordinates[1]}, ${element.geometry.coordinates[0]}]<br><b>Magnitude:</b> ${element.properties.mag}<br><b>Depth:</b> ${element.geometry.coordinates[2]}</div>`));
    createMap(earthquakes);
}

function createMap(earthquakes) {
    // Create the base layers.
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })

    let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    // Create a baseMaps object.
    let baseMaps = {
        "Street Map": street,
        "Topographic Map": topo
    };

    // Create an overlays object.
    let overlays = L.layerGroup(earthquakes);

    // Create a new map.
    // Edit the code to add the earthquake data to the layers.
    let myMap = L.map("map", {
        center: [37.09, -95.71],
        zoom: 5,
        layers: [street, overlays]
    });

    earthquakes.forEach(element => {
        element.addTo(myMap);
    });

    let overlayMaps = { "Earthquakes": overlays };

    // Create a layer control that contains our baseMaps.
    // Be sure to add an overlay Layer that contains the earthquake GeoJSON.
    L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(myMap);
    let legend = L.control({position: 'bottomright'});
    legend.onAdd = (map) => {
        let div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.setAttribute('style', 'width:67px;background-color:white;padding:5px;border-radius:5px;');
        let legendHtmlArray = ["<b>Depth</b>"];
        let categories = [
            `< ${steps[0]}`,
            `${steps[0]}-${steps[1]}`,
            `${steps[1]}-${steps[2]}`,
            `${steps[2]}-${steps[3]}`,
            `${steps[3]}-${steps[4]}`,
            `${steps[4]}-${steps[5]}`,
            `${steps[5]}-${steps[6]}`,
            `${steps[6]}-${steps[7]}`,
            `${steps[7]}-${steps[8]}`,
            `> ${steps[8]}`
        ];

        for (let x = 0; x < categories.length; ++x) {
            legendHtmlArray.push(`<div style='height:1em;width:1em;display:inline-block;background-color:${colors[x]}'></div>&nbsp;${categories[x]}`);
        }

        div.innerHTML = legendHtmlArray.join("<br>");
        return div;
    };
    legend.addTo(myMap);
}
