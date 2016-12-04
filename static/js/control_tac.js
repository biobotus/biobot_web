// TAC Graph
var transition_time = 500,
    data = [],
    counter = 0,
    x,
    y_temp,
    y_turb,
    xAxis,
    yAxis_temp,
    yAxis_turb,
    svg,
    line_temp,
    line_turb,
    lineGen_temp,
    lineGen_turb,
    pathLine_temp,
    pathLine_turb,
    focus_temp,
    focus_turb;

var margin = {top: 25, bottom: 25, left: 25, right: 25},
    height = 200 - margin.top - margin.bottom,
    width = 600 - margin.left - margin.right;

function UTC_Date(utc) {
    var d = new Date(0);
    d.setUTCSeconds(utc);
    return d;
}

function start() {
    x = d3.time.scale()
        .domain(d3.extent(data, function(d) {return d.date}))
        .range([0, width-50]);

    y_temp = d3.scale.linear()
        .domain(d3.extent(data, function(d) {return d.temp}))
        .range([height, 0]);

    y_turb = d3.scale.linear()
        .domain(d3.extent(data, function(d) {return d.turb}))
        .range([height, 0]);

    xAxis = d3.svg.axis()
        .scale(x)
        .ticks(5)
        .orient("bottom");

    yAxis_temp = d3.svg.axis()
        .scale(y_temp)
        .ticks(5)
        .tickSize(-width, 0, 0)
        .orient("left");

    yAxis_turb = d3.svg.axis()
        .scale(y_turb)
        .ticks(5)
        .tickSize(-width, 0, 0)
        .orient("left");

    svg_temp = d3.select("#tac-graph-temp").append("svg")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom)
        .attr("style", "overflow:inherit;")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg_turb = d3.select("#tac-graph-turb").append("svg")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom)
        .attr("style", "overflow:inherit;")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg_temp.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg_turb.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg_temp.append("g")
        .attr("class", "y axis temp")
        .attr("transform", "translate(0,0)")
        .call(yAxis_temp)

    svg_turb.append("g")
        .attr("class", "y axis turb")
        .attr("transform", "translate(0,0)")
        .call(yAxis_turb);

    line_temp = svg_temp.append("line")
        .attr("class", "line");

    line_turb = svg_turb.append("line")
        .attr("class", "line");

    focus_temp = svg_temp.append("g")
        .attr("fill", "purple");

    focus_turb = svg_turb.append("g")
        .attr("fill", "darkorange");

    focus_temp.append("circle")
        .attr("r", 5);

    focus_turb.append("circle")
        .attr("r", 5);

    focus_temp.append("text")
        .attr("x", 0)
        .attr("dy", "-0.7em");

    focus_turb.append("text")
        .attr("x", 0)
        .attr("dy", "-0.7em");

    lineGen_temp = d3.svg.line()
        .x(function(d, i) {
            return x(i <= counter ? d.date : data[counter].date);
        })
        .y(function(d, i) {
            return y_temp(i <= counter ? d.temp : data[counter].temp);
        })

    lineGen_turb = d3.svg.line()
        .x(function(d, i) {
            return x(i <= counter ? d.date : data[counter].date);
        })
        .y(function(d, i) {
            return y_turb(i <= counter ? d.turb : data[counter].turb);
        })

    pathLine_temp = svg_temp.append("path").datum(data)
        .attr("d", lineGen_temp)
        .classed("line", true)
        .style("stroke", "red")

    pathLine_turb = svg_turb.append("path").datum(data)
        .attr("d", lineGen_turb)
        .classed("line", true)
        .style("stroke", "dodgerblue")

    line_temp
        .attr("x", x(data[counter].date))
        .attr("y", height-y_temp(data[counter].temp));

    line_turb
        .attr("x", x(data[counter].date))
        .attr("y", height-y_turb(data[counter].turb));

    focus_temp.attr("transform", "translate(" + x(data[counter].date) + "," + y_temp(data[counter].temp) + ")");
    focus_turb.attr("transform", "translate(" + x(data[counter].date) + "," + y_turb(data[counter].turb) + ")");

    focus_temp.select("text").text(data[counter].temp);
    focus_turb.select("text").text(data[counter].turb);

    svg_temp.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Current Temperature (\u00BAC)");

    svg_turb.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Current Turbidity (%)");
}

function new_tac_value(time, temp, turb) {
    var new_data = {date: UTC_Date(time), temp: +temp, turb: +turb}

    if (data.length == 0) {
        data[0] = new_data;
        return start();
    }

    data[counter+1] = new_data;

    x.domain(d3.extent(data, function(d) {return d.date}))
    y_temp.domain(d3.extent(data, function(d) {return d.temp}))
    y_turb.domain(d3.extent(data, function(d) {return d.turb}))

    line_temp
        .attr("x", x(data[counter].date))
        .attr("y", height-y_temp(data[counter].temp));

    line_turb
        .attr("x", x(data[counter].date))
        .attr("y", height-y_turb(data[counter].turb));

    counter++;
    var d = data[counter]

    line_temp
        .transition()
        .duration(transition_time)
        .attr("x", x(data[1].date))
        .attr("y", height-y_temp(data[1].temp));

    line_turb
        .transition()
        .duration(transition_time)
        .attr("x", x(data[1].date))
        .attr("y", height-y_turb(data[1].turb));

    pathLine_temp
        .transition()
        .duration(transition_time)
        .attr("d", lineGen_temp)

    pathLine_turb
        .transition()
        .duration(transition_time)
        .attr("d", lineGen_turb)

    focus_temp
        .transition()
        .duration(transition_time)
        .attr("transform", "translate(" + x(d.date) + "," + y_temp(d.temp) + ")");

    focus_turb
        .transition()
        .duration(transition_time)
        .attr("transform", "translate(" + x(d.date) + "," + y_turb(d.turb) + ")");

    focus_temp
        .transition()
        .delay(transition_time)
        .select("text").text(data[counter].temp);

    focus_turb
        .transition()
        .delay(transition_time)
        .select("text").text(data[counter].turb);

    svg_temp.select(".x.axis")
        .transition()
        .duration(transition_time)
        .call(xAxis)

    svg_turb.select(".x.axis")
        .transition()
        .duration(transition_time)
        .call(xAxis)

    svg_temp.select(".y.axis.temp")
        .transition()
        .duration(transition_time)
        .call(yAxis_temp)

    svg_turb.select(".y.axis.turb")
        .transition()
        .duration(transition_time)
        .call(yAxis_turb)
}

