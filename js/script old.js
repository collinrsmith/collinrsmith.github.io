const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const t = 2000 // 1000ms
const states =
{
    // 'District of Columbia': 'DC',
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};
const parseTime = d3.timeParse("%Y%m%d");
let colorScales;

const mapOptions = ["TMIN", "TMAX", "TAVG", "PRCP", "SNOW", "SNWD"]
let mapVar = "TMAX"

let months = []
for (let i = 0; i < 9; i++) months.push(new Date(2017,i,1))
let monthRange = newMonthRange(months[0],months[8])// vis range
let allData = []; // state weather data
let monthlyData = {} // bucket the data for faster filtering
let currentData = []
let miny, maxy;
let xScale, yScale, sizeScale;

// Create SVG.
const svg = d3.select("#vis")
.append("svg")
.attr("width", width+margin.left+margin.right)
.attr("height", height+margin.top+margin.bottom)
.append("g")
.attr("transform", `translate(${margin.left}, ${margin.top})`)
function init() {
    d3.csv("./data/weather.csv", d => ({
        station: d.station,
        state: d.state,
        lat: +d.latitude,
        long: +d.longitude,
        elevation: +d.elevation,
        date: parseTime(d.date),
        TMIN: +d.TMIN, // degrees F
        TMAX: +d.TMAX,
        TAVG: +d.TAVG,
        AWND: +d.AWND,
        WDF5: +d.WDF5,
        WSFS: +d.WSFS,
        SNOW: +d.SNOW,
        SNWD: +d.SNWD,
        PRCP: +d.PRCP
    }))
    .then(data => {
        let statesVar = ["ME", "MD"]
        // create buckets for each state and month
        statesVar.forEach(s => {
            monthlyData[s] = [];        // bucket for each state
            for (let i = 0; i < 9; i++) {
                monthlyData[s].push([]) // bucket for each month in state
            }
        })
        // filter us data into buckets
        data.forEach(d => {
            const s = d.state
            if (statesVar.includes(s)){//(Object.values(states).includes(s)) {
                const m = d.date.getMonth() // 0 indexed
                monthlyData[s][m].push(d)
            }
        })
        setupSelector()
        // rendering
        updateAxes()
        updateVis()
        // addLegend

    })
    .catch(error => console.error('Error loading data:', error))
}

// function initMap(mapdata) {
//     // Sources in index.html.
//     // Create an svg element to hold our map, and set it to the proper width and
//     // height. The viewBox is set to a constant value becase the projection we're
//     // using is designed for that viewBox size:
//     // https://github.com/topojson/us-atlas#us-atlas-topojson

//     // Create the US boundary
//     const usa = svg
//     .append('g')
//     .append('path')
//     .datum(topojson.feature(mapdata, mapdata.objects.nation))
//     .attr('d', d3.geoPath())
//     // console.log(mapdata.objects.states)

//     // Create the state boundaries. "stroke" and "fill" set the outline and fill
//     // colors, respectively.
//     const states = svg
//     .append('g')
//     .attr('stroke', '#444')
//     .attr('fill', '#eee')
//     .selectAll('path')
//     .data(topojson.feature(mapdata, mapdata.objects.states).features)
//     .join('path')
//     .attr("class", "state")
//     .attr('vector-effect', 'non-scaling-stroke')
//     .attr('d', d3.geoPath())
//     .on('mouseover', function (event, d) {
//         d3.select('#tooltip')
//         .style("display", 'block')
//         .html(
//         `<strong>${d.properties.name}</strong><br/>`)
//         .style("left", (event.pageX + 20) + "px")
//         .style("top", (event.pageY - 28) + "px");
//     })
//     .on("mouseout", function (event, d) {
//         d3.select('#tooltip')
//         .style('display', 'none')
//     })
//     .on("click", function (event, d) {selectState(this)})
// }

// function setMonthData(data) {
//     // console.log(allData)
// }

// // Highlight only one state at a time
// function selectState(state) {
//     if (selectedState != null) {
//         selectedState
//         .transition(t)
//         .attr("fill", "#eee")
//     }
//     selectedState = d3.select(state)
//     selectedState
//     .transition(t)
//     .attr("fill", "#ccc")

//     updateDetailView()
//     // update map
// }

// function updateDetailView() {
//     stateName = selectedState.data()[0]["properties"]["name"]
//     d3.select("#detail-title")
//     .html(`<h4>Detail View: ${stateName}</h4>
//         <p>Month: ${monthRange[0]}</p><p>Max Temp Range: ${1}-${10}F</p>`) 
// }

// Set up vis controls.
// TODO: brush slider
function setupSelector() {
    // Create month slider.
    let slider = d3
    .sliderBottom()
    .min(new Date(2017, 0, 1))
    .max(new Date(2017, 8, 1))
    .marks(monthlyData)
    .tickFormat(d3.timeFormat("%b"))
    .width(300)
    .default(monthRange)
    .on("onchange", v => {
        monthRange = newMonthRange(v[0],v[1])
        updateAxes()
        updateVis()
    })
    
    d3.select('#slider')
    .append('svg')
    .attr('width', 2*width)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)')
    .call(slider);

    // Change dataset when toggling buttons.
    d3.selectAll(".variable")
    .on("change", function (event) {
        if (d3.select(this).property("checked")) {
            mapVar = d3.select(this).property("id")
            updateAxes()
            updateVis()
        }
    })
}

function updateAxes() {
    // console.log(monthRange[0])
    svg.selectAll('.axis').remove()
    svg.selectAll('.labels').remove()
    xScale = d3.scaleTime()
        .domain(monthRange)
        .range([0, width-2*margin.left]);
    const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%B"))

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${2*margin.left},${height-margin.top})`)    
        .call(xAxis);
    
    yScale = d3.scaleLinear()
        .domain([miny,maxy])
        .range([height-3*margin.top, 0]);
    const yAxis = d3.axisLeft(yScale)
    // .ticks(16)

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left+20}, ${margin.top})`)
        .call(yAxis);

    // X-axis label
    svg.append("text")
        .attr("x", width/2+margin.left)
        .attr("y", height+margin.top)
        .attr("text-anchor", "middle")
        .text("Time")
        .attr('class', 'labels')

    // Y-axis label (rotated)
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("y", margin.right)
        .attr("text-anchor", "middle")
        .text(convertLabel(mapVar))
        .attr('class', 'labels')
}

function newMonthRange(m1,m2){
    return [new Date(m1), d3.timeDay.offset(new Date(m2),30)]
}
function roll(data) {
    return d3.rollup(
        data,
        v => ({
            // mapVar: f(v, d=>d[mapVar])
            "TMAX": d3.max(v, d=>d.TMAX),
            "TMIN": d3.min(v, d=>d.TMIN),
            "TAVG": d3.median(v, d=>d.TAVG),
            "PRCP": d3.max(v, d=>d.PRCP),
            "SNOW": d3.max(v, d=>d.SNOW),
            "SNWD": d3.max(v, d=>d.SNWD),
        }),
        d => d.state
    )
}

function updateVis() {
    currentData = []

    const color = getColorScale()
    .domain([miny,maxy])
    const g_states = svg.selectAll("g.state-group")
    .data(currentData)
    .join("g")
    .attr("class", "state-group")

    g_states.selectAll(".points")
    .data(d => d)
    .join(
        function(enter){
            return enter
            .append("circle")
            .attr("class","points")
            .attr("cx", d => xScale(d.date)+2*margin.left)
            .attr("cy", d => yScale(d[mapVar])+20)
            .attr("r", 0)
            .style("opacity", 0.9)
            .style("fill", d=> color(d[mapVar]))
            .transition(t)
            .attr("r", 4)
        },
        function(update){
            return update
            .transition(t)
            .attr("cx", d => xScale(d.date)+2*margin.left)
            .attr("cy", d => yScale(d[mapVar])+18)
            .style("fill", d=> color(d[mapVar]))
            .attr("r", 4)
        },
        function(exit){
            return exit
            .transition(t)
            .attr("r", 0)
            .remove()
        }
    )
}

function convertLabel(str) {
    switch (str) {
        case 'TMAX': return "Max Temp (F)"
        case 'TMIN': return "Min Temp (F)"
        case 'TAVG': return "Avg Temp (F)"
        case 'SNOW': return "Snowfall (In)"
        case 'SNWD': return "Snow Depth (In)"
        case 'PRCP': return "Precipitation (In)"
        default: return "noValue"
    }
}

function getColorScale() {
    switch (mapVar) {
        case 'TMAX': return d3.scaleSequential(d3.interpolateYlOrBr)
        case 'TMIN': return d3.scaleSequential(d3.interpolateCool)
        case 'TAVG': return d3.scaleSequential().interpolator(t => d3.interpolateSpectral(1-t))
        case 'SNOW': return d3.scaleSequential(d3.interpolateBuPu)
        case 'SNWD': return d3.scaleSequential(d3.interpolateBlues)
        case 'PRCP': return d3.scaleSequential(d3.interpolateBrBG)
        // default: return "noValue"
    }
}

window.addEventListener("load", init());
// window.addEventListener('DOMContentLoaded', async (event) => {
//     const res = await fetch(`https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json`)
//     const mapJson = await res.json()
    // initMap(mapJson)});