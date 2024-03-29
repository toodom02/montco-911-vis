import { barChart } from "./barChart.js";

// choropleth map based on 911 calls in municipal area
export const choroplethMap = (parent, props) => {
    const {
      filteredData,
      selectedTypes,
      selectedReason,
      municipalities,
      pathGenerator,
      colourBlind,
      colourScale
    } = props;

    const types = Object.keys(selectedTypes);
  
    // group by township, then by type
    const groupedData = d3.rollups(filteredData, v => v, d => d.twp, d => d.type);
  
    // Add num of events to our minicipal data
    municipalities.features.forEach(d => {
      types.forEach(key => d.properties[key] = 0);
      const groupelem = groupedData.find(g => d.properties.Name == g[0]);
      if (groupelem) groupelem[1].forEach(t => d.properties[t[0]] = t[1].length);
      d.properties.total = d3.sum(types.map(key => d.properties[key]));
    });
  
    const colours = colourScale.range()
    const respectiveRGBs = colours.map(c => [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]);
  
    // Paths for municipalities
    const municip = parent.selectAll('.municipality').data(municipalities.features, d => d.properties.Name);
    const municipEnter = municip.enter().append('path')
      .attr('class','municipality');
    municipEnter
      .attr('d', pathGenerator)
      .attr('opacity', 0)
      .merge(municip)
      .transition().duration(1000)
        .attr('opacity', 1)
        .attr('fill', d => {
          if (d.properties.total === 0) return 'white';
          // colour blind mode: only show dominant colour
          if (colourBlind) return colourScale(types[d3.maxIndex(types, k => d.properties[k])]);

          // Blend our 3 colours together for area colour, based on percentage of each type
          const redperc = d.properties.Fire / d.properties.total * 100;
          const blueperc = d.properties.EMS / d.properties.total * 100;
          const yellowperc = d.properties.Traffic / d.properties.total * 100;
          const totalperc = redperc + blueperc + yellowperc;
          const red = Math.round((respectiveRGBs[0][0] * redperc + respectiveRGBs[1][0] * blueperc + respectiveRGBs[2][0] * yellowperc) / totalperc);
          const green = Math.round((respectiveRGBs[0][1] * redperc + respectiveRGBs[1][1] * blueperc + respectiveRGBs[2][1] * yellowperc) / totalperc);
          const blue = Math.round((respectiveRGBs[0][2] * redperc + respectiveRGBs[1][2] * blueperc + respectiveRGBs[2][2] * yellowperc) / totalperc);  
          return `rgb(${red},${green},${blue})`
        });
    municip.exit()
      .transition().duration(1000)
        .attr('opacity', 0).remove();
  
    // Tooltip event listeners
    const tooltip = d3.select('#tooltip');
    const tooltipPadding = 15;
    municipEnter.merge(municip)
      .on('mouseenter', (event, d) => {
        const barData = groupedData.find(dat => dat[0]==d.properties.Name);
        tooltip
          .html(`
          <div class="tooltip-title">${d.properties.Name}</div>
          ${selectedReason ? '<div><i class="tooltip-i">' + selectedReason + '</i></div>' : ''}
          <div>${barData ?'<svg id="tooltip-svg" width="150" height="150"></svg>' : 'No Calls'}</div>
          `);
        if (!barData) return;
        // Create bar chart in tooltip
        const svg = d3.select('#tooltip-svg');
        svg.call(barChart, {
          data: barData[1], 
          margin: { top: 5, bottom: 25, left: 30, right: 5 },
          xValue: d => d[0],
          xTickLabels: Object.keys(selectedTypes),
          yValue: d => d[1].length,
          yAxisLabel: '# Calls',
          colourScale,
          selectedTypes
        });
      })
      .on('mousemove', (event, d) => {
        tooltip
          .style('display', 'block')
          .style('left', (event.pageX + tooltipPadding) + 'px')   
          .style('top', (event.pageY + tooltipPadding) + 'px')
      })
      .on('mouseleave', () => {
        tooltip.style('display', 'none');
      });
  
  }