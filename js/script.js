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
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-top", "50px")

const g = svg.append("g")
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
            monthRange = createMonthRange(v[0], v[1])
            setCurrentData()
            updateAxes()
            updateVis()
        })

    d3.select('#slider')
        .append('svg')
        .attr('width', 2 * width)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(slider);

    d3.selectAll(".variable")
        // loop over each dropdown button
        .each(function () {
            d3.select(this).selectAll('myOptions')
                .data(Object.keys(states))
                .enter()
                .append('option')
                .text(d => d) // The displayed text
                .attr("value", d => states[d]) // The actual value used in the code
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
    console.log()
    svg.selectAll('.axis').remove()
    svg.selectAll('.labels').remove()

    xScale = d3.scaleTime()
        .domain([monthRange[0], d3.timeDay.offset(monthRange[1], 30)])
        .range([margin.left, width - margin.right])
    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b"))

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},${height - margin.bottom / 2})`)
        .call(xAxis);

    yScale = d3.scaleLinear()
        .domain(yDomain)//[-40,140])
        .range([height - margin.bottom, margin.top]);
    const yAxis = d3.axisLeft(yScale)

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left + margin.right}, ${margin.top})`)
        .call(yAxis);

    // // X-axis label
    svg.append("text")
        .attr('class', 'labels')
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 2 * margin.top / 3)
        .attr("text-anchor", "middle")
        .text(`Month in ${stateVar[0]}`) // Displays the current x-axis variable

    // // Y-axis label (rotated)
    svg.append("text")
        .attr('class', 'labels')
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .text(convertLabel(yVar)) // Displays the current y-axis variable
}

function updateVis() {
    const color = getColorScale()
    switch (yVar) {
        case "TMIN":
        case "TMAX":
        case "TAVG":
            color.domain([0, 100])
            break;
        default: color.domain(yDomain)
    }
    // .domain([0,120])//yDomain
    let allRecs = []
    for (let m = monthRange[0].getMonth(); m < monthRange[1].getMonth(); m++) {
        const month = currentData[m]
        statecodes.forEach(s => {
            if (month[s]) {
                const recs = Object.entries(month[s]).map((a, b) => a[1])
                recs.forEach(r => allRecs.push(r))
            }
        })
    }
    console.time()
    const mappedRecs = allRecs.map(d => ({
        yval: d[yVar],
        lab: convertLabel(yVar),
        cx: xScale(d.date),
        cy: yScale(d[yVar]),
        fill: color(d[yVar]),
        date: d3.timeFormat("%B %d, %Y")(d.date),
        state: d.state
    }));
    // console.log(mappedRecs)
    // console.log(g.selectAll(".points"))
    g.selectAll(".points")
        .data(mappedRecs)
        .join(
            function (enter) {
                return enter
                    .append("circle")
                    .attr("class", "points")
                    // .attr("cx", 0)
                    // .attr("cy",0)
                    .attr("transform", d => `translate(${d.cx}, ${d.cy})`)
                    .attr("r", 0)
                    .attr("opacity", 0.8)
                    .attr('stroke', 'black')
                    .attr("stroke-width", "0px")
                    .style("fill", d => d.fill)
                    .on('mouseover', function (event, d) {
                        d3.select('#tooltip')
                            .style("display", 'block')
                            .html(
                                `<strong>${d.state}</strong><br/>${d.date}<br/>
                        ${d.lab}: ${d.yval}`)
                            .style("left", (event.pageX + 20) + "px")
                            .style("top", (event.pageY - 28) + "px")
                            .style('stroke', 'black')
                        d3.select(this)
                            .style('stroke-width', '3px')
                    })
                    .on("mouseout", function (event, d) {
                        d3.select('#tooltip')
                            .style('display', 'none') // Hide tooltip when cursor leaves
                        d3.select(this)
                            .style('stroke-width', '0px')
                    })
                    // .on("click", (e,d) => {
                    //     updateDetailView(d)
                    // })
                    .transition()
                    .duration(300)
                    .delay((d, i) => i * 1.5)
                    .attr('stroke-width', '0.1px')
                    .attr("r", sizeVar)
            },
            function (update) {
                return update
                    .attr('stroke-width', '0.1px')
                    .transition()
                    .duration(300)
                    .delay((d, i) => i * 1.25)
                    .attr("transform", d => `translate(${d.cx}, ${d.cy})`)
                    .attr('stroke', 'black')

                    .style("fill", d => d.fill)
                    .attr("r", sizeVar)
            },
            function (exit) {
                return exit
                    .transition()
                    .duration(100)
                    .delay((d, i) => i * 1.05)
                    .remove()
            })
    console.timeEnd()
}

// function updateDetailView(rec) {
//     // let stateName = selectedState.data()[0]["properties"]["name"]
//     d3.select("#detail-title")
//     .html(`<h4>Detail View: ${rec.state}</h4>
//         <p>Month: ${rec.date}</p><p>Max Temp Range: ${1}-${10}F</p>`) 
// }
// Filter for data from selected states within month range/
// determine y domain 
function setCurrentData() {
    let yDom = [null, null]
    currentData = [{}, {}, {}, {}, {}, {}, {}, {}, {}];

    let m1 = monthRange[0].getMonth();
    let m2 = monthRange[1].getMonth();

    for (m1; m1 < m2; m1++) {
        const mData = monthlyData[m1];
        stateVar.forEach(s => {
            currentData[m1][s] = mData[s]
            const currDomain = d3.extent(mData[s], d => d[yVar])

            // find min and max for yVar
            if (yDom[0] == null || yDom[1] == null) yDom = currDomain
            if (currDomain[0] <= yDom[0]) yDom[0] = currDomain[0]
            if (currDomain[1] >= yDom[1]) yDom[1] = currDomain[1]
            // console.log("Curr domain:",currDomain)
            // console.log("Y domain:",yDom)
        })
    }
    yDomain = yDom
    // console.log(yVar)
    // console.log(currentData)
}

function createMonthRange(m1, m2) {
    return [new Date(m1), new Date(m2)]//d3.timeDay.offset(new Date(m2),30)]
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
        case 'TMAX': //return d3.scaleSequential(d3.interpolateYlOrBr)
        case 'TMIN': //return d3.scaleSequential(d3.interpolateCool)
        case 'TAVG': {
            return d3.scaleSequential().interpolator(t => d3.interpolateRdYlBu(1 - t))
        }//.interpolator(t => d3.interpolateSpectral(1-t))
        case 'SNOW': {
            return d3.scaleSequential(d3.interpolateBuPu)
        }
        case 'SNWD': {
            return d3.scaleSequential(d3.interpolateBlues)
        }
        case 'PRCP': {
            return d3.scaleSequential(d3.interpolateBrBG)
        }
        // default: return "noValue"
    }
}

window.addEventListener("load", init());