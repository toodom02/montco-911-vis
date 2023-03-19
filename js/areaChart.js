export const areaChart = (parent, props) => {
  const {
    data,
    colourScale,
    types,
    margin,
    onSelectRange,
    selectedTypes,
    selectedReason
  } = props;

  const width = +parent.attr('width');
  const height = +parent.attr('height');
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const selectedTypesArr = Object.keys(selectedTypes).filter(key => selectedTypes[key]);

  const xValue = d => d.data[0];
  const yValue = d => d[1];

  // Group data by date
  const groupedData = d3.groups(data, d => d.date);

  // Count # of each incident type
  groupedData.forEach(d => {
    const v = d[1];
    types.forEach(t => 
        v[t] = v.reduce((n,x) => n+(x.type===t && (!selectedReason || x.reason===selectedReason)), 0)
    );
  })

  // stack data
  const stack = d3.stack()
    .keys(selectedTypesArr)
    .value((d,key) => d[1][key]);

  const stackedData = stack(groupedData);

  // Initialise scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(groupedData, d => d[0]))
    .range([0, innerWidth]);

  // domain for yScale (to account for empty data)
  const upperDom = stackedData.length > 0 ? d3.max(stackedData[stackedData.length-1], d => d[1]) : 0;
  const yScale = d3.scaleLinear()
    .domain([0, upperDom])
    .range([innerHeight, 0]);

  // Initialise axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(3);

  // Group for chart
  const chart = parent.selectAll('.area-container').data([null]);
  const chartEnter = chart.enter().append('g')
    .attr('class', 'area-container')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Append empty x-axis group
  const xAxisG = chart.select('.x-axis');
  const xAxisGEnter = chartEnter.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${innerHeight})`);
  
  // Append y-axis group
  const yAxisG = chart.select('.y-axis');
  const yAxisGEnter = chartEnter.append('g')
      .attr('class', 'axis y-axis');

  const yAxisLabelText = yAxisG.select('.axis-label');
  const yAxisLabelTextEnter = yAxisGEnter
    .append('text')
      .attr('class', 'axis-label')
      .attr('y', -32)
      .attr('fill', 'black')
      .attr('transform', `rotate(-90)`)
      .attr('text-anchor', 'middle');
  yAxisLabelText
    .merge(yAxisLabelTextEnter)
      .attr('x', -innerHeight/2)
      .text('# Calls');

  xAxisG.merge(xAxisGEnter).call(xAxis);
  yAxisG.merge(yAxisGEnter).transition().duration(1000).call(yAxis);

  const areaGenerator = d3.area()
    .x(d => xScale(xValue(d)))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(yValue(d)));

  const areasG = chartEnter.merge(chart).selectAll('.areas').data([null]);
  const areasGEnter = areasG.join('g')
      .attr('class', 'areas');

  const cats = areasGEnter.merge(areasG).selectAll('.area-path').data(stackedData, d => d.key);
  const catsEnter = cats.enter().append('path')
    .attr('class', 'area-path')
    .attr('opacity', 0);
  catsEnter.merge(cats)
    .transition().duration(1000)
      .attr('opacity', 1)
      .attr('d', d => areaGenerator(d))
      .attr('fill', d => colourScale(d.key));

  cats.exit().transition().duration(1000).attr('opacity', 0).remove();

  // Brush selection to choose timeframe
  const brush = d3.brushX()
  .extent([[0,0], [innerWidth, innerHeight]])
    .on('end', e => {
      if (!e.selection) return;
      const extent = e.selection;
      const getDate = (x) => {
        const x0 = xScale.invert(x);
        // find closest data point to mouse xpos
        const index = d3.bisectLeft(stackedData[0].map(xValue), x0, 1);
        const d0 = stackedData[0][index - 1];
        const d1 = stackedData[0][index];
        if (!d1) return d0;
        return x0 - xValue(d0) > xValue(d1) - x0 ? d1 : d0;
      }
      const startx = getDate(extent[0]);
      const endx = getDate(extent[1]);
      onSelectRange(startx.data[0], endx.data[0])
    })

  chartEnter.merge(chart).call(brush)

  // Create circular tooltips
  const circlesG = chartEnter.merge(chart).selectAll('.tooltip-circles').data([null]);
  const circlesGEnter = circlesG.join('g')
    .attr('class', 'tooltip-circles')
    .attr('display', 'none')
    .style('pointer-events', 'none');

  const circles = circlesGEnter.merge(circlesG).selectAll('circle').data(selectedTypesArr);
  circles.join('circle')
    .attr('id', d => d)
    .attr('r', 4);

  const tooltipPadding = 15;
  const tooltip = d3.select('#tooltip');

  // rectangle to capture mouse (reusing the rect created by Brush)
  d3.select('rect.overlay')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .on('mouseenter', () => {circlesGEnter.attr('display', 'block'); tooltip.style('display', 'block')})
    .on('mouseleave', () => {tooltip.style('display', 'none'); circlesGEnter.attr('display', 'none')})
    .on('mousemove', event => {
      const x0 = xScale.invert(d3.pointer(event)[0]);
      const getClosest = (i) => {
        // find closest data point to mouse xpos
        const index = d3.bisectLeft(stackedData[i].map(xValue), x0, 1);
        const d0 = stackedData[i][index - 1];
        const d1 = stackedData[i][index];
        return d1 && x0 - xValue(d0) > xValue(d1) - x0 ? d1 : d0;
      }
      const d = selectedTypesArr.map((e,i) => getClosest(i));
      // move the group to that position on chart
      selectedTypesArr.forEach((e,i) => 
        d3.select(`#${e}`).attr('transform', `translate(${xScale(xValue(d[i]))},${yScale(yValue(d[i]))})`)
      )
      // Tooltip info
      if (selectedTypesArr.length > 0) {
        tooltip
          .style('left', (event.pageX + tooltipPadding) + 'px')   
          .style('top', (event.pageY + tooltipPadding) + 'px')
          .html(`
            <div class="tooltip-title">${d[0].data[0].toLocaleString("en-gb", {day:'numeric', month:'long', year:'numeric'})}</div>
            <div><i class="tooltip-i">${selectedReason ? selectedTypesArr[0] + ' - ' + selectedReason : ''}</i></div>
            ${Object.keys(selectedTypes).map(k =>
              selectedReason && selectedTypesArr[0] != k ? '' : '<div><i class="tooltip-i">'+d[0].data[1][k]+' '+k+' calls</i></div>'
            ).join('')}
        `);
      }
    });
};
