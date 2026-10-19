const parseTime = d3.timeParse("%Y%m%d");

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
const statecodes = Object.values(states)
const options = ["TMIN", "TMAX", "TAVG", "PRCP", "SNOW", "SNWD"]

let currentData = []
let monthlyData = []
let months = []
for (let i = 0; i < 9; i++) {
    months.push(new Date(2017, i, 1))
}
let monthRange = createMonthRange(months[0], months[8]) // Jan 2017 - Sep 2017
let stateVar = ["AL"]
let sizeVar = 4
let yVar = "TMAX"
let yDomain = []
const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const t = 2000 // delay in ms

const svg = d3.select("#vis")
.append("svg")
.attr("width", width+margin.left+margin.right)
.attr("height", height+margin.top+margin.bottom)
.style("margin-top", "50px")
// .attr("display", "block")
// .attr("overflow", "visible")
// .attr("viewBox", `0 0 ${width} ${height}`)
.style("background-color", "#bdbdbd20")

const g = svg.append("g")
.attr("transform", `translate(${margin.left}, ${margin.top})`)

// const brush = d3.brush()
// .extent([margin.left, margin.top], [width-margin.right, height-margin.bottom])
// .on("start brush end", brushed)

// svg.append("g")
// .attr("class", "brush")
// .call(brush)

// function brushed(event) {
//   const selection = event.selection; // Contains [[x0, y0], [x1, y1]] boundaries

//   if (selection === null) {
//     // If the brush selection is cleared, reset all dots
//     dots.attr('fill', 'steelblue');
//   } else {
//     // Destructure the bounding box pixels
//     const [[x0, y0], [x1, y1]] = selection;

//     // Toggle a class or attribute based on whether the dot falls inside the box
//     dots.attr('fill', d => {
//       const cx = xScale(d.x);
//       const cy = yScale(d.y);
      
//       // Check if pixel coordinates fall within the brush box boundaries
//       const isBrushed = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
      
//       return isBrushed ? 'crimson' : 'steelblue';
//     });
//   }
// }
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
        // console.time()
        // months[jan] = {"MD":[readings], "ME":[readings], ...}
        for (let i = 0; i < 9; i++) {
            monthlyData.push({})
            statecodes.forEach(s => {
                monthlyData[i][s] = []
            })
        }
        data.forEach(d => {
            // take data from US states
            if (statecodes.includes(d.state)) {
                const m = d.date.getMonth()
                const s = d.state
                monthlyData[m][s].push(d)
            }
        })
        setupSelector()

        setCurrentData()
        updateAxes()
        updateVis()
    })
    .catch(error => console.error('Error loading data:', error))
}

// Set up vis controls.
function setupSelector() {
    // Create month slider.
    // console.log(monthRange)
    let slider = d3
    .sliderBottom()
    .min(monthRange[0])
    .max(monthRange[1])
    .marks(months)
    .tickFormat(d3.timeFormat("%b"))
    .width(300)
    .default(monthRange)
    .on("onchange", v => {
        monthRange = createMonthRange(v[0],v[1])
        setCurrentData()
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

    d3.selectAll(".variable")
    // loop over each dropdown button
    .each(function() {
        d3.select(this).selectAll('myOptions')
        .data(Object.keys(states))
        .enter()
        .append('option')
        .text(d=>d) // The displayed text
        .attr("value",d => states[d]) // The actual value used in the code
    })
    .on("change", function (event) {
        const id = d3.select(this).property("id")

        if (d3.select(this).property("checked")) {
            yVar = id
        }
        else if (id == "stateVariable") {
            stateVar = [d3.select(this).property("value")]
            // console.log(stateVar)
        }
        else if (id == "sizeVariable") {
            sizeVar = d3.select(this).property("value")
        }
        setCurrentData()
        updateAxes()
        updateVis()
    })
}

function updateAxes() {
    svg.selectAll('.axis').remove()
    svg.selectAll('.labels').remove()

    xScale = d3.scaleTime()
        .domain(monthRange)
        .range([margin.left, width-margin.right])
    const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%b"))

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},${height-margin.bottom/2})`)    
        .call(xAxis);
    
    yScale = d3.scaleLinear()
        .domain(yDomain)
        .range([height-margin.bottom, margin.top]);
    const yAxis = d3.axisLeft(yScale)

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left+margin.right}, ${margin.top})`)
        .call(yAxis);

    // // X-axis label
    svg.append("text")
        .attr('class', 'labels')
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top+ 2*margin.top/3)
        .attr("text-anchor", "middle")
        .text("Time") // Displays the current x-axis variable

    // // Y-axis label (rotated)
    svg.append("text")
        .attr('class', 'labels')
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .text(convertLabel(yVar)) // Displays the current y-axis variable
}

function updateVis() {
    const color = getColorScale()
    .domain(yDomain)
    let allRecs = []
    for (let m = monthRange[0].getMonth(); m < monthRange[1].getMonth(); m++) {
        const month = currentData[m]
        statecodes.forEach(s => {
            if (month[s]){
            const recs = Object.entries(month[s]).map((a,b) => a[1])
            recs.forEach(r => allRecs.push(r))}
        })
    }
    g.selectAll(".points")
        .data(allRecs)
        .join(
            function(enter) {
                return enter
                .append("circle")
                .attr("class", "points")
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScale(d[yVar]))
                .attr("r", 0)
                .attr("opacity", 0.8)
                .style("fill", d => color(d[yVar]))
                .on('mouseover', function (event, d) {
                    // console.log(d) // See the data point in the console for debugging
                    d3.select('#tooltip')
                        // if you change opacity to hide it, you should also change opacity here
                        .style("display", 'block') // Make the tooltip visible
                        .html( // Change the html content of the <div> directly
                        `<strong>${d.state}</strong><br/>
                        ${convertLabel(yVar)}: ${d[yVar]}<br/>
                        ${d3.timeFormat("%B %d, %Y")(d.date)}`)
                        .style("left", (event.pageX + 20) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    d3.select(this) // Refers to the hovered circle
                    .style('stroke', 'black')
                    .style('stroke-width', '4px')
                })
                .on("mouseout", function (event, d) {
                    d3.select('#tooltip')
                    .style('display', 'none') // Hide tooltip when cursor leaves
                    d3.select(this)
                    .style('stroke-width', '0px')
                })
                .transition(t)
                .attr("r", sizeVar)
            },
            function(update) {
                return update
                .transition(t)
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScale(d[yVar]))
                .style("fill", d=> color(d[yVar]))
                .attr("r", sizeVar)
            },
            function(exit){
                return exit
                .transition(t)
                .attr("r", 0)
                .remove()
            })
}


// Filter for data from selected states within month range/
// determine y domain 
function setCurrentData() {
    let yDom = [null,null]
    currentData = [{},{},{},{},{},{},{},{},{}];

    let m1 = monthRange[0].getMonth();
    let m2 = monthRange[1].getMonth();
    
    for (m1; m1 < m2; m1++) {
        const mData = monthlyData[m1];
        stateVar.forEach(s => {
            currentData[m1][s] = mData[s]
            const currDomain = d3.extent(mData[s], d => d[yVar])

            if (yDom[0] == null || yDom[1] == null) {
                yDom = currDomain
            }
            else {
                yDom = currDomain[0] <= yDom[0] && currDomain[1] >= yDom[1]
                ? currDomain : yDom
            }
        })
    }
    yDomain = yDom
    console.log(currentData)
    // console.log(yDomain)
}

function createMonthRange(m1,m2) {
    return [new Date(m1), d3.timeDay.offset(new Date(m2),30)]
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
    switch (yVar) {
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