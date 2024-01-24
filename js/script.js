// setting dimensions and margins fro the chart
const margin = { top: 70, right: 30, bottom: 40, left: 80 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// setting up the x and y scales
const xScale = d3.scaleTime().range([0, width]);

const yScale = d3.scaleLinear().range([height, 0]);

// create a svg element and append it to the chart container
const svg = d3
  .select("#chart-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// create tooltip div
const tooltip = d3.select("body").append("div").attr("class", "tooltip");

// load and process data
d3.csv("./data/jdi_data_daily.csv").then((data) => {
  const parseDate = d3.timeParse("%Y-%m-%d");
  data.forEach((d) => {
    d.date = parseDate(d.date);
    d.population = +d.population;
  });
  // console.log(data);

  // define x and y domains
  xScale.domain(d3.extent(data, (d) => d.date));
  yScale.domain([85000, d3.max(data, (d) => d.population)]);

  // x-axis
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(d3.timeMonth.every(6))
    .tickFormat(d3.timeFormat("%b %Y"));
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .style("font-size", "14px")
    .call(xAxis)
    .call((g) => g.select(".domain").remove())
    .selectAll(".tick line")
    .style("stroke-opacity", 0);
  svg.selectAll(".tick text").attr("fill", "#777");

  // y-axis
  const yAxis = d3
    .axisLeft(yScale)
    .ticks((d3.max(data, (d) => d.population) - 85000) / 5000)
    .tickFormat((d) => {
      return `${(d / 1000).toFixed(0)}k`;
    })
    .tickSize(0)
    .tickPadding(10);
  svg
    .append("g")
    .style("font-size", "14px")
    .call(yAxis)
    .call((g) => g.select(".domain").remove())
    .selectAll(".tick text")
    .style("fill", "#777")
    .style("visibility", (d, i, nodes) => {
      if (i === 0) {
        return "hidden";
      } else {
        return "visible";
      }
    });

  // vertical gridlines
  svg
    .selectAll("xGrid")
    .data(xScale.ticks().slice(1))
    .join("line")
    .attr("x1", (d) => xScale(d))
    .attr("x2", (d) => xScale(d))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#e0e0e0")
    .attr("stroke-width", 0.5);

  // horizontal gridlines
  svg
    .selectAll("yGrid")
    .data(
      yScale.ticks((d3.max(data, (d) => d.population) - 85000) / 5000).slice(1)
    )
    .join("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", (d) => yScale(d))
    .attr("y2", (d) => yScale(d))
    .attr("stroke", "#e0e0e0")
    .attr("stroke-width", 0.5);

  // line generator
  const line = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.population));

  // add line path to SVG element
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1)
    .attr("d", line);

  // add a circle element
  const circle = svg
    .append("circle")
    .attr("r", 0)
    .attr("fill", "steelblue")
    .style("stroke", "white")
    .attr("opacity", 0.7)
    .style("pointer-events", "none");

  // create SVG element and append it to the chart container

  // create a listening rectangle
  const listeningRect = svg
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  // create the mouse move function
  listeningRect.on("mousemove", function (event) {
    const [xCoord] = d3.pointer(event, this);
    const bisectDate = d3.bisector((d) => d.date).left;
    const x0 = xScale.invert(xCoord);
    const i = bisectDate(data, x0, 1);
    const d0 = data[i - 1];
    const d1 = data[i];
    const d = x0 - d0.date > d1.data - x0 ? d1 : d0;
    const xPos = xScale(d.date);
    const yPos = yScale(d.population);

    // update the circle position
    circle.attr("cx", xPos).attr("cy", yPos);
    // console.log(xPos, yPos);

    // add transition for the circle radius
    circle.transition().duration(50).attr("r", 5);

    // adding tooltip
    tooltip
      .style("display", "block")
      .style("left", `${xPos + 100}px`)
      .style("top", `${yPos + 50}px`)
      .html(
        `<strong>Date:</strong> ${d.date.toLocaleDateString()}<br><strong>population:</strong> ${
          d.population !== undefined
            ? (d.population / 1000).toFixed(0) + "k"
            : "N/A"
        }`
      );
  });

  // listening reactangle mouse leave function
  listeningRect.on("mouseleave", function () {
    circle.transition().duration(50).attr("r", 0);

    tooltip.style("display", "none");
  });

  // y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#777")
    .style("font-family", "sans-serif")
    .text("Total Population");

  // chart title
  svg
    .append("text")
    .attr("class", "chart-title")
    .attr("x", margin.left - 115)
    .attr("y", margin.top - 100)
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("font-family", "sans-serif")
    .text(
      "Prison Population in the US Have Trended Upward Since Summer 2020"
    );
});
