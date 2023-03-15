import { choroplethMap } from "./choroplethMap.js";
import { symbolMap } from "./symbolMap.js";

export const statesMap = (parent, props) => {
  const {
    states,
    counties,
    municipalities,
    data,
    dateRange,
    selectedTypes,
    selectedReason,
    mapOption,
    onMapOptionSelected,
    colourBlind,
    onColourBlindSelected,
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

  const g = parent.selectAll('.parent-g').data([null]);
  const gEnter = g.enter().append('g')
    .attr('class', 'parent-g');

  const chart = gEnter.append('g')
    .attr('class', 'map-container');

  // Zoom interactivity
  const zoom = d3.zoom()
    .scaleExtent([1, 100])
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', event => chart.attr('transform', event.transform));

  gEnter.call(zoom);

  // Zoom to initial position
  gEnter
    .transition().duration(5000)
      .call(zoom.transform, d3.zoomIdentity.translate(-38400,-9250).scale(50));

  // Group for map elements
  const mapG = chart.append('g')
    .attr('class','map');

  // Earth's border (click to reset zoom)
  mapG.append('path')
    .attr('class', 'sphere')
    .attr('d', pathGenerator({type: 'Sphere'}))
    .on('click', () => 
      gEnter.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(-38400,-9250).scale(50)
      ));

  // Paths for states
  mapG.merge(g).selectAll('.state').data(states.features)
    .join('path')
      .attr('class','state')
      .attr('d', pathGenerator);

  // Paths for counties
  mapG.merge(g).selectAll('.county').data(counties.features)
    .join('path')
      .attr('class','county')
      .attr('d', pathGenerator);

  // Listener for radio button
  d3.selectAll('input[name="map-type"]')
    .on('change', onMapOptionSelected);
  d3.selectAll('input[name="colourblind"]')
    .on('change', onColourBlindSelected);

  const pointsG = chart.merge(g).selectAll('.points-g').data([null]);
  const pointsGEnter = pointsG.enter().append('g')
      .attr('class', 'points-g')

  // depending on selection, call appropriate map plot and delete previous
  if (mapOption==='points') {
    pointsG.selectAll('.municipality').remove();
    pointsGEnter.merge(pointsG).call(
      symbolMap, {
        filteredData,
        projection,
        symbolScale,
        colourScale,
        colourValue,
        pointsG,
        pointsGEnter
      })
  } else {
    pointsG.selectAll('.call').remove();
    pointsGEnter.merge(pointsG).call(
      choroplethMap, {
        filteredData,
        selectedTypes,
        selectedReason,
        municipalities,
        pathGenerator,
        colourBlind,
        colourScale
      })
  }
}
  