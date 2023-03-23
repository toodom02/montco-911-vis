import { loadAndProcessData } from './loadAndProcessData.js'
import StatesMap from './statesMap.js'
import { colourLegend } from './colourLegend.js';
import { areaChart } from './areaChart.js';
import { pieChart } from './pieChart.js';

const onSelectType = (event, d) => {
  selectedTypes[d] = !selectedTypes[d];
  // if none selected, reset to all selected
  if (Object.keys(selectedTypes).every(key => !selectedTypes[key])) {
    Object.keys(selectedTypes).forEach(key => selectedTypes[key] = true)
  }
  selectedReason = null;
  updateVis();
}

const onSelectReason = (event, d) => {
  // if already selected, unselect.
  if (selectedReason === d.data[0] && selectedTypes[d.data[1][0].type]) {
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
let states, counties, municipalities, callData, dateRange, selectedReason, colourBlind, statesMap;
let pieOption = 'group';
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
  // need to update changed props, since passed by value.
  statesMap.props.colourBlind = colourBlind;
  statesMap.props.selectedReason = selectedReason;
  statesMap.props.mapOption = mapOption;
  statesMap.updateVis();
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
  dateRange = [callData[0].date, callData[0].date];

  statesMap = new StatesMap(svgMap, {
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
  })
  updateVis();
});

