export const loadAndProcessData = () =>
  Promise
    .all([
      d3.json('./data/states-albers-10m.json'),
      d3.json('./data/PaCounty.geojson'),
      d3.csv('./data/911.csv')
    ])
    .then(([topoData, countyData, csvData]) => {      
      // Conversion from TopoJSON to GeoJSON
      const states = topojson.feature(topoData, topoData.objects.states);
      const counties = countyData;
      // Parse CSV data 
      csvData.forEach(d => {
        d.timeStamp = new Date(d.timeStamp);
        d.lat = +d.lat;
        d.lng = +d.lng;
        let title = d.title.split(':');
        d.type = title[0].trim();
        d.reason = title[1].replace('-','').trim().toUpperCase();
        d.e = d.e == 1;
      });

      console.log(csvData)

      // Return array containing GeoJSON and symbols data
      return [states, counties, csvData];
    });

