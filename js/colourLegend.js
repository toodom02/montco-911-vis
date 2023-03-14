export const colourLegend = (parent, props) => {
  const { 
    colourScale, 
    onSelect,
    selectedTypes,
    selectedReason,
    dateRange
  } = props;

  const spacing = 25;
  const circleRadius = 10;
  const textOffset = 15;

  const width  = +parent.attr('width');
  const height = +parent.attr('height');

  // group for legend
  const g = parent.selectAll('.leg-container').data([null]);
  const gEnter = g.enter().append('g')
    .attr('class', 'leg-container')
    .attr('transform', `translate(${50},${height - (spacing * colourScale.domain().length + circleRadius * 1.5) - 50})`);

  // add background
  gEnter.append('rect')
      .attr('class','legend-bg')
      .attr('x', -circleRadius * 2)
      .attr('y', -circleRadius * 2)
      .attr('rx', circleRadius * 2)
      .attr('stroke', 'black')
      .attr('width', 325)
      .attr('height', spacing * (colourScale.domain().length + 1) + circleRadius * 1.5);

  const groups = gEnter.merge(g).selectAll('.legend').data(colourScale.domain());
  const groupsEnter = groups
    .enter().append('g')
      .attr('class','legend')
      .attr('transform', (d, i) => `translate(0, ${i * spacing})`)
      .on('click', onSelect);

  const circle = groups.select('circle');
  groupsEnter.append('circle')
    .merge(circle)
      .attr('fill', colourScale)
      .attr('r', circleRadius)
      .attr('fill-opacity', d => selectedTypes[d] ? 1 : 0.2)
      .attr('opacity', d => selectedTypes[d] ? 1 : 0.2);

  const text = groups.select('text');
  groupsEnter.append('text')
    .merge(text)
      .text(d => (!selectedReason || !selectedTypes[d]) ? d : d + ` - ${selectedReason}`)
      .attr('x', textOffset)
      .attr('opacity', d => selectedTypes[d] ? 1 : 0.2);

  // title with date range
  const textEnterText = g.select('.range-label');
  const textEnter = gEnter.append('text')
    .attr('class', 'range-label')
    .attr('x', textOffset)
    .attr('y', `${3*spacing}`);

  textEnterText
    .merge(textEnter)
      .text(`${dateRange[0].toLocaleString("en-gb", {day:"numeric", month:"numeric", year:"numeric"})} - ${dateRange[1].toLocaleString("en-gb", {day:"numeric", month:"numeric", year:"numeric"})}`);

}


