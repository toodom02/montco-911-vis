import { choroplethMap } from "./choroplethMap.js";
import { symbolMap } from "./symbolMap.js";

// we use OOP approach to use invocation of updateVis, 
// saving us the expensive task of redrawing the map every time.

export default class StatesMap {
  /**
   * @param _parent {D3 selection}
   * @param _props  {Object}
   */
  constructor(_parent, _props, _data) {
    this.parent = _parent;
    this.props = {
      states : _props.states,
      counties : _props.counties,
      municipalities : _props.municipalities,
      data : _props.data,
      dateRange : _props.dateRange,
      selectedTypes : _props.selectedTypes,
      selectedReason : _props.selectedReason,
      mapOption : _props.mapOption,
      onMapOptionSelected : _props.onMapOptionSelected,
      colourBlind : _props.colourBlind,
      onColourBlindSelected : _props.onColourBlindSelected,
      colourScale : _props.colourScale,
      colourValue : _props.colourValue,
      symbolScale : _props.symbolScale
    };
    this.initVis();
  }
  
  /**
   * initVis(): Class method to initialise scales/axes and append static chart elements
   */
  initVis() {
    let vis = this;

    // Margin conventions
    const width  = +this.parent.attr('width');
    const height = +this.parent.attr('height');
  
    // Define projection and pathGenerator
    vis.projection = d3.geoAlbersUsa()
    vis.pathGenerator = d3.geoPath().projection(vis.projection);
  
    const g = vis.parent.selectAll('.parent-g').data([null]);
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
      .attr('d', vis.pathGenerator({type: 'Sphere'}))
      .on('click', () => 
        gEnter.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity.translate(-38400,-9250).scale(50)
        ));
  
    // Paths for states
    mapG.merge(g).selectAll('.state').data(vis.props.states.features, d => d.id)
      .join('path')
        .attr('class','state')
        .attr('d', vis.pathGenerator);
  
    // Paths for counties
    mapG.merge(g).selectAll('.county').data(vis.props.counties.features, d => d.id)
      .join('path')
        .attr('class','county')
        .attr('d', vis.pathGenerator);
  
    // Listener for radio button
    d3.selectAll('input[name="map-type"]')
      .on('change', vis.props.onMapOptionSelected);
    d3.selectAll('input[name="colourblind"]')
      .on('change', vis.props.onColourBlindSelected);
  
    vis.pointsG = chart.merge(g).selectAll('.points-g').data([null]);
    vis.pointsGEnter = vis.pointsG.join('g')
        .attr('class', 'points-g');
  };

  /**
   * updateVis(): Class method to update visualisation
   */
  updateVis() {
    let vis = this;

    // filter our data by date & selection
    const filteredData = vis.props.data.filter(d => 
      vis.props.selectedTypes[d.type] && 
      (!vis.props.selectedReason || d.reason === vis.props.selectedReason) && 
      d.date >= vis.props.dateRange[0] && d.date <= vis.props.dateRange[1]
    );

    // depending on selection, pass data to symbol or choropleth map
    vis.pointsGEnter.merge(vis.pointsG).call(
      symbolMap, {
        filteredData : vis.props.mapOption==='points' ? filteredData : [],
        projection : vis.projection,
        symbolScale : vis.props.symbolScale,
        colourScale : vis.props.colourScale,
        colourValue : vis.props.colourValue
      })

    vis.pointsGEnter.merge(vis.pointsG).call(
      choroplethMap, {
        filteredData : vis.props.mapOption==='regional' ? filteredData : [], 
        selectedTypes : vis.props.selectedTypes,
        selectedReason : vis.props.selectedReason,
        municipalities : vis.props.mapOption==='regional' ? vis.props.municipalities : {features:[]},
        pathGenerator : vis.pathGenerator,
        colourBlind : vis.props.colourBlind,
        colourScale : vis.props.colourScale
      })
  }
}