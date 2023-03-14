import { loadAndProcessData } from './loadAndProcessData.js'
import { statesMap } from './statesMap.js'
import { colourLegend } from './colourLegend.js';
import { areaChart } from './areaChart.js';
import { pieChart } from './pieChart.js';

const onSelectType = (event, d) => {
  selectedTypes[d] = !selectedTypes[d];
  selectedReason = null;
  updateVis();
}

const onSelectReason = (event, d) => {
  if (selectedReason === d.data[0]) {
    selectedReason = null;
    Object.keys(selectedTypes).forEach(key => selectedTypes[key] = true)
  } else {
    selectedReason = d.data[0];
    Object.keys(selectedTypes).forEach(key => selectedTypes[key] = d.data[1][0].type === key);
  }
  updateVis();
}

const onSelectRange = (start,end) => {
  dateRange[0] = new Date(start);
  dateRange[1] = new Date(end);
  updateVis();
}

const onPieOptionSelected = event => {
  pieOption = event.target.value;
  updateVis();
}

// select all our SVGs
const svgMap = d3.select('svg#map');
const svgArea = d3.select('svg#area');
const svgPie = d3.select('svg#pie');

// initialise globals
let states, counties, callData, dateRange, selectedReason, pieOption;
const types = ['Fire','EMS','Traffic'];
const selectedTypes = types.reduce((o, key) => ({ ...o, [key]: true}), {});

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

const updateVis = () => {

  svgMap.call(statesMap, {
    margin: { top: 50, bottom: 80, left: 150, right: 40 },
    states,
    counties,
    data : callData,
    selectedTypes,
    selectedReason,
    dateRange,
    colourScale,
    colourValue: d => d.type,
    symbolScale
  })

  svgMap.call(colourLegend, {
    colourScale,
    onSelect : onSelectType,
    selectedTypes,
    dateRange
  })

  svgArea.call(areaChart, {
    data: callData,
    colourScale,
    types,
    margin: {top: 30, bottom: 25, left: 40, right: 20},
    onSelectRange,
    selectedTypes
  })

  svgPie.call(pieChart, {
    data: callData,
    colourScale,
    selectedTypes,
    selectedReason,
    dateRange,
    pieOption,
    onSelectType,
    onSelectReason,
    onPieOptionSelected
  })

};

loadAndProcessData().then(loadedData => {
  states = loadedData[0];
  counties = loadedData[1];
  callData = loadedData[2];
  const date = new Date(callData[0].timeStamp.getFullYear(), callData[0].timeStamp.getMonth(), callData[0].timeStamp.getDate());
  dateRange = [date, date];
  updateVis();
});

