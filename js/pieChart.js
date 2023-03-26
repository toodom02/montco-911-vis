
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
    radius
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
  const pie = d3.pie().sort((a,b) => a[0]==='OTHER' ? 1 : (b.value - a.value)).value(d => d.value);
  const arc = d3.arc()
    .innerRadius(radius / 2)
    .outerRadius(radius);

  const outerArc = d3.arc()
    .innerRadius(radius)
    .outerRadius(radius);

  // groups for arcs
  const arcG = chartEnter.merge(chart).selectAll('.arc').data(pie(data[1]), d => d.data[0]);
  const arcGEnter = arcG.enter().append('path')
    .attr('class', d => `${d.data[0] === 'OTHER' ? 'other-arc' : ''} arc`);
  arcGEnter.merge(arcG)
    .attr('opacity', d => {
      if (selectedTypes[data[0]]) {
        return (!selectedReason || selectedReason===d.data[0] ? 1 : 0.5)
      } else return 0.2;
    })
    .attr('stroke', d => 
      selectedTypes[data[0]] && selectedReason===d.data[0] ? 'black' : 'white'
    )
    .attr('fill', colourScale(data[0]))
    .on('click', (e,d) => d.data[0]!='OTHER' ? onSelectReason(e,d) : null);

  // custom transition function for arcs (otherwise errors)
  arcGEnter.merge(arcG).transition().duration(1000)
    .attrTween('d', (d,i,nodes) => {
        // Seems like a bug in d3, when attrTween called over unchanged data it
        // stalls for ~5 seconds. To solve, we catch when data is (mostly) unchanged
        // and return basic arc.
      if (nodes[i]._current && 
          Math.abs(d.startAngle - nodes[i]._current.startAngle) < 0.15 && 
          Math.abs(d.endAngle - nodes[i]._current.endAngle) < 0.15) {
        return () => arc(d)
      }
      const j = d3.interpolate(nodes[i]._current, d);
      nodes[i]._current = j(0);
      return t => arc(j(t));
    })
  arcG.exit().remove();

  // text labels

  // only label top 3 values
  const labelData = (pie(data[1]).sort((a,b) => b.value - a.value)).slice(0,3)
  const midAngle = (d) => d.startAngle + (d.endAngle - d.startAngle)/2;

  // group for label and line
  const labelG = chartEnter.merge(chart).selectAll('.pie-label-group').data(labelData, d => d.data[0]);
  const labelGEnter = labelG.enter().append('g')
    .attr('class', 'pie-label-group');
  labelG.exit().remove();

  // append label
  const labelText = labelG.select('.pie-text-labels');
  const labelTextEnter = labelGEnter.append('text')
    .attr('class', 'pie-text-labels')
    .attr('dy', '.35em')
    .attr('opacity', 0)
    .text(d => d.data[0]);
  // make label transition nicely to center of arc
  labelText.merge(labelTextEnter)
    .transition().duration(1000)
      .attr('opacity', 1)
      .attr('transform', d => {
        const pos = outerArc.centroid(d);
        pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
        return `translate(${pos})`;
      })
      .attr('text-anchor', d => midAngle(d) < Math.PI ? 'start' : 'end');
  labelText.exit().remove();

  // arc to text polylines
  const polyline = labelG.select('.pie-label-line');
  const polylineEnter = labelGEnter.append('polyline')
    .attr('class', 'pie-label-line')
    .style('pointer-events', 'none');
  polyline.merge(polylineEnter)
    .transition().duration(1000)
      .attr('points', d => {
        const pos = outerArc.centroid(d);
        pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
        return [arc.centroid(d), outerArc.centroid(d), pos];
      });
  polyline.exit().remove();

  // Tooltip event listeners
  const tooltip = d3.select('#tooltip');
  const tooltipPadding = 15;
  arcGEnter
    .on('mouseover', (event, d) => {
      tooltip
        .style('display', 'block')
        .html(`
          <div class="tooltip-title">${d.data[0]}</div>
          <div><i class="tooltip-i">${d.data.value} Calls</i></div>
          <div><i class="tooltip-i">${((d.endAngle - d.startAngle)/(2*Math.PI)*100).toFixed(2)}% of ${data[0]} Calls</i></div>
          ${d.data[0]==='OTHER' ?
            '<table class="tooltip-table">' +
            d.data[1].map(t => '<tr><td>'+ t.value + '</td><td> - ' + t[0] + '</td></tr>').join('') + '</table>' : ''}
        `);
    })
    .on('mousemove', (event, d) => {
      tooltip
        .style('left', (event.pageX + tooltipPadding) + 'px')   
        .style('top', (event.pageY + tooltipPadding) + 'px')
    })
    .on('mouseleave', () => {
      tooltip.style('display', 'none');
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

  // Filter our dates if we only want range
  const filteredData = data.filter(d => d.date >= dateRange[0] && d.date <= dateRange[1])

  // Group by type, then by reason
  let groupedData = d3.rollups(filteredData, v => v, d => d.type, d => d.reason);

  // calculate total reasons for each type
  groupedData.forEach(t => {
    t.total = 0;
    t[1].forEach(d => {
      d.value = d[1].length
      t.total += d.value;
    })
  })

  // largest % to show in pie chart
  const threshold = 0.01;

  if (pieOption === 'group') {
    // find any reasons with <1% share, and group together under 'OTHER'
    groupedData = groupedData.map(t => {
      const big_items = t[1].filter(d => d.value / t.total > threshold);
      const other = ['OTHER', t[1].filter(d => d.value / t.total <= threshold).sort((a,b) => b.value-a.value)];
      other.value = d3.sum(other[1], d => d.value)
      if (other.value > 1) {
        big_items.push(other);
        return [t[0], big_items];
      } else return t;
    })
  }

  const radius = 100;

  // define positions for each pie chart
  // (not centered, to allow for labels on rhs)
  const positions = [
    [radius, height/4],
    [9/4*radius + (width - 2*radius)/2, height/4],
    [(radius + (9/4*radius + (width - 2*radius)/2)) / 2, 3*height/4]
  ];

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
      onSelectReason,
      radius
    })
  });

} 