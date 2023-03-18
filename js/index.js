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
    if (d.data[1].length <= 0) return;
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
  updatePie();
}

const onMapOptionSelected = event => {
  // If change is cancelled, reset checked value
  if (event.target.value === 'points' && !confirm("Warning: a large range will run slowly")) {
    event.target.checked = false;
    d3.select('input#regional').property('checked', true);
    return
  };
  mapOption = event.target.value;
  updateMap();
}

const onColourBlindSelected = event => {
  colourBlind = event.target.checked;
  if (mapOption==='regional') updateMap();
}

// select all our SVGs
const svgMap = d3.select('svg#map');
const svgArea = d3.select('svg#area');
const svgPie = d3.select('svg#pie');

// initialise globals
let states, counties, municipalities, callData, dateRange, selectedReason, colourBlind;
let pieOption = 'range';
let mapOption = 'regional';
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

const updateMap = () => {
  svgMap.call(statesMap, {
    states,
    counties,
    municipalities,
    data : callData,
    selectedTypes,
    selectedReason,
    mapOption,
    onMapOptionSelected,
    colourBlind,
    onColourBlindSelected,
    dateRange,
    colourScale,
    colourValue: d => d.type,
    symbolScale
  });
}

const updatePie = () => {
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
}

const updateVis = () => {

  updateMap();

  svgMap.call(colourLegend, {
    colourScale,
    onSelect : onSelectType,
    selectedTypes,
    selectedReason,
    dateRange
  });

  svgArea.call(areaChart, {
    data: callData,
    colourScale,
    types,
    margin: {top: 30, bottom: 25, left: 40, right: 20},
    onSelectRange,
    selectedTypes,
    selectedReason
  });

  updatePie();
};

loadAndProcessData().then(loadedData => {
  states = loadedData[0];
  counties = loadedData[1];
  municipalities = loadedData[2];
  callData = loadedData[3];
  const date = new Date(callData[0].timeStamp.getFullYear(), callData[0].timeStamp.getMonth(), callData[0].timeStamp.getDate());
  dateRange = [date, date];
  updateVis();
});

