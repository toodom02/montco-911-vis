
// func to make the actual pie charts, called 3 times
const makePie = (parent, props) => {
  const {
    position,
    data,
    colourScale,
    selectedTypes,
    selectedReason,
    onSelectType,
    onSelectReason,
  } = props;

  // chart group
  const chart = parent.selectAll(`#pie-${data[0]}`).data([null]);
  const chartEnter = chart.enter().append('g')
    .attr('id', `pie-${data[0]}`)
    .attr('transform', `translate(${position[0]},${position[1]})`);

  // add text to center
  chartEnter.append('text')
    .attr('class', 'pie-label')
    .attr('text-anchor', 'middle')
    .text(data[0])
    .on('click', (e) => onSelectType(e, data[0]))

  // make the pie chart
  const pie = d3.pie().value(d => d[1].length);
  const arc = d3.arc()
    .innerRadius(50)
    .outerRadius(100);

  // groups for arcs
  const arcG = chartEnter.merge(chart).selectAll('.arc').data(pie(data[1]));
  const arcGEnter = arcG.join('path')
    .attr('class', 'arc')
    .attr('opacity', d => selectedTypes[data[0]] ? (!selectedReason || selectedReason===d.data[0] ? 1 : 0.5) : 0.2)
    .attr('stroke', d => selectedTypes[data[0]] && selectedReason===d.data[0] ? 'black' : 'white')
    .attr('fill', colourScale(data[0]))
    .on('click', onSelectReason);
  arcGEnter.transition().duration(2000)
      .attr('d', arc)

  // Tooltip event listeners
  const tooltipPadding = 15;
  arcGEnter
    .on('mousemove', (event, d) => {
      d3.select('#tooltip')
        .style('display', 'block')
        .style('left', (event.pageX + tooltipPadding) + 'px')   
        .style('top', (event.pageY + tooltipPadding) + 'px')
        .html(`
          <div class="tooltip-title">${d.data[0]}</div>
          <div><i class="tooltip-i">${d.data[1].length} Calls</i></div>
          <div><i class="tooltip-i">${((d.endAngle - d.startAngle)/(2*Math.PI)*100).toFixed(2)}% of ${data[0]} Calls</i></div>
        `);
    })
    .on('mouseleave', () => {
      d3.select('#tooltip').style('display', 'none');
    });
}


export const pieChart = (parent, props) => {
  const {
    data,
    colourScale,
    selectedTypes,
    selectedReason,
    dateRange,
    pieOption,
    onSelectType,
    onSelectReason,
    onPieOptionSelected
  } = props;

  const width  = +parent.attr('width');
  const height = +parent.attr('height');

  // group data by type
  let groupedData = d3.groups(data, d => d.type);
  // group each type by reason
  groupedData = groupedData.map(t => [t[0],d3.groups(t[1], d => d.reason)]);

  // Filter our dates if we only want range
  if (pieOption === 'range') {
    groupedData = groupedData.map(t => 
      [t[0], t[1].map(s => 
        [s[0], s[1].filter(d => {
          const date = new Date(d.timeStamp.getFullYear(), d.timeStamp.getMonth(), d.timeStamp.getDate());
          return date >= dateRange[0] && date <= dateRange[1]
        })])
      ])
  }

  // define positions for each pie chart
  const positions = [
    [width/4, height/4],
    [3*width/4, height/4],
    [width/2, 3*height/4]
  ]

  // Listener for selector
  d3.select('#pie-selector')
    .on('change', onPieOptionSelected);

  // make pie charts
  groupedData.forEach((d,i) => {
    parent.call(makePie, {
      data: d, 
      position: positions[i], 
      colourScale,
      selectedTypes,
      selectedReason,
      onSelectType,
      onSelectReason
    })
  })

} 