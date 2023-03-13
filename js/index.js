import { loadAndProcessData } from './loadAndProcessData.js'
import { statesMap } from './statesMap.js'
import { colourLegend } from './colourLegend.js';
import { areaChart } from './areaChart.js';

const onSelectType = (event, d) => {
  selectedValues[d] = !selectedValues[d];
  updateVis();
}

const onSelectRange = (start,end) => {
  dateRange[0] = new Date(start);
  dateRange[1] = new Date(end);
  updateVis();
}

const svgMap = d3.select('svg#map');
const svgArea = d3.select('svg#area');
let states, counties, callData, dateRange;

const types = ['Fire','EMS','Traffic'];
// Colour scale (shared between views)
const colourScale = d3.scaleOrdinal()
  .range(['#fe4a49', '#2ab7ca', '#fed766'])
  .domain(types);

// Symbol scale (redundant for colour)
const symbolScale = d3.scaleOrdinal()
  .domain(types)
  .range([
    d3.symbol().type(d3.symbolStar).size(0.02)(),
    d3.symbol().type(d3.symbolCross).size(0.02)(),
    d3.symbol().type(d3.symbolDiamond).size(0.02)()
  ]);

let selectedValues = types.reduce((o, key) => ({ ...o, [key]: true}), {})

const updateVis = () => {

  svgMap.call(statesMap, {
    margin: { top: 50, bottom: 80, left: 150, right: 40 },
    states,
    counties,
    data : callData,
    selectedValues,
    dateRange,
    colourScale,
    colourValue: d => d.type,
    symbolScale
  })

  svgMap.call(colourLegend, {
    colourScale,
    onSelect : onSelectType,
    selectedValues,
    dateRange
  })

  svgArea.call(areaChart, {
    data: callData,
    colourScale,
    types,
    margin: {top: 30, bottom: 25, left: 40, right: 20},
    onSelectRange,
    selectedValues
  })

};

loadAndProcessData().then(loadedData => {
  states = loadedData[0];
  counties = loadedData[1];
  callData = loadedData[2];
  dateRange = [callData[0].timeStamp, callData[100].timeStamp];
  updateVis();
});

