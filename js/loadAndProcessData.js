export const loadAndProcessData = () =>
  Promise
    .all([
      d3.json('./data/states-albers-10m.json'),
      d3.json('./data/PaCounty.geojson'),
      d3.json('./data/Montgomery_County_Municipal_Boundaries.geojson'),
      d3.csv('./data/911.csv')
    ])
    .then(([topoData, countyData, municipalData, csvData]) => {      
      // Conversion from TopoJSON to GeoJSON
      const states = topojson.feature(topoData, topoData.objects.states);
      // Capitalise municipal names
      municipalData.features.forEach(d => {
        d.properties.Name = d.properties.Name.toUpperCase().replace('TWP','TOWNSHIP');
      })
      // Parse CSV data 
      csvData.forEach((d,i) => {
        d.timeStamp = new Date(d.timeStamp);
        // get only date (ignore time)
        d.date = new Date(d.timeStamp.getFullYear(), d.timeStamp.getMonth(), d.timeStamp.getDate());
        d.lat = +d.lat;
        d.lng = +d.lng;
        let title = d.title.split(':');
        d.type = title[0].trim();
        d.reason = title[1].replace('-','').trim().toUpperCase();
        // add identifier key
        d.key = i;
      });   

      // Return array containing GeoJSONs and csv data
      return [states, countyData, municipalData, csvData];
    });

