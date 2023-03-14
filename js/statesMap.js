export const statesMap = (parent, props) => {
    const { 
      margin,
      states,
      counties,
      data,
      dateRange,
      selectedTypes,
      selectedReason,
      colourScale,
      colourValue,
      symbolScale
    } = props;
  
    const width  = +parent.attr('width');
    const height = +parent.attr('height');
  
    // filter our data by date & selection
    const filteredData = data.filter(d => {
      // new date to ignore time
      const date = new Date(d.timeStamp.getFullYear(), d.timeStamp.getMonth(), d.timeStamp.getDate());
      return selectedTypes[d.type] && 
      (!selectedReason || d.reason === selectedReason) && 
      date >= dateRange[0] && date <= dateRange[1]
    });
  
    // Define projection and pathGenerator
    const projection = d3.geoAlbersUsa()
    const pathGenerator = d3.geoPath().projection(projection);
  
    const chart = parent.selectAll('.map-container').data([null]);
    const chartEnter = chart.enter().append('g')
      .attr('class', 'map-container');

    // Zoom interactivity
    const zoom = d3.zoom()
      .scaleExtent([1, 75])
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', event => chartEnter.attr('transform', event.transform));

    chartEnter.call(zoom);

    chartEnter
      .transition().duration(5000)
        .call(zoom.transform, d3.zoomIdentity.translate(-38500,-9250).scale(50));

    // Group for map elements
    const mapG = chart.select('.map');
    const mapGEnter = chartEnter.append('g')
      .attr('class','map');
  
    // Earth's border (click to reset zoom)
    mapGEnter.append('path')
      .attr('class', 'sphere')
      .attr('d', pathGenerator({type: 'Sphere'}))
      .on('click', () => 
        chartEnter.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity.translate(-38500,-9250).scale(50)
        ));
  
    // Paths for states
    mapGEnter.merge(mapG).selectAll('.state').data(states.features)
      .join('path')
        .attr('class','state')
        .attr('d', pathGenerator);

    // Paths for counties
    mapGEnter.merge(mapG).selectAll('.county').data(counties.features)
      .join('path')
        .attr('class','county')
        .attr('d', pathGenerator);

    // 911 Calls
    const calls = chartEnter.merge(chart).selectAll('.call').data(filteredData, d=>d);
    const callsEnter = calls.enter()
      .append('path')
      .attr('class', 'call')
      .attr('opacity', 0)
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
  