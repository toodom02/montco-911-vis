// Plots each 911 call individually
export const symbolMap = (parent, props) => {
  const {
    filteredData,
    projection,
    symbolScale,
    colourScale,
    colourValue
  } = props;

  // 911 Calls
  const calls = parent.selectAll('.call').data(filteredData, d => d.key);
  const callsEnter = calls.enter()
    .append('path')
    .attr('class', 'call')
    .attr('opacity', 0);
  callsEnter.merge(calls)
    .attr('transform', d => `translate(${projection([d.lng, d.lat])[0]}, ${projection([d.lng, d.lat])[1]})`)
    .attr('d', d => symbolScale(colourValue(d)))
    .attr('fill', d => colourScale(colourValue(d)))
    .attr('stroke-width', 0.05)
    .transition().duration(1000)
      .attr('opacity', 1);
  calls.exit()
    .transition().duration(1000)
      .attr('opacity', 0)
    .remove();

  // Tooltip event listeners
  const tooltipPadding = 15;
  callsEnter
    .on('mouseover', (event, d) => {
      d3.select('#tooltip')
        .style('display', 'block')
        .style('left', (event.pageX + tooltipPadding) + 'px')   
        .style('top', (event.pageY + tooltipPadding) + 'px')
        .html(`
          <div class="tooltip-title">${d.type}: ${d.reason}</div>
          <div><i class="tooltip-i">${d.timeStamp.toLocaleString("en-gb")}</i></div>
        `);
    })
    .on('mouseleave', () => {
      d3.select('#tooltip').style('display', 'none');
    });
}