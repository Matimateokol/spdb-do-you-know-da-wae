import React, { useRef, useEffect, useState } from 'react';
import { Map, NavigationControl } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Popup } from '@vis.gl/react-maplibre';
import exampleGEOJSON from '../assets/exampleGEOJSON.json';


function NavMap({onDblClick, onRightDblClick, children }) {
  // const mapContainer = useRef(null);

  // let geoData = Object.assign({}, exampleGEOJSON);
  // delete geoData.metadata;

  // const [exampleData, setExampleData] = useState(geoData);
  // const featuresLength = exampleData.features.length;

  // useEffect(() => {
  //   const map = new maplibregl.Map({
  //     container: mapContainer.current,
  //     style: 'https://tiles.openfreemap.org/styles/bright',
  //     center: [21.006725, 52.231958],
  //     zoom: 10,
  //   });

  //   map.addControl(new maplibregl.NavigationControl(), 'top-right');

  //   const firstFeature = exampleData.features[0];
  //   const startPopup = new maplibregl.Popup({ textColor: 'black' }).setHTML("<h1 style='color:red;'>Start Point</h1>");
  //   const startPoint = new maplibregl.Marker({ color: 'red' })
  //     .setLngLat(firstFeature.geometry.coordinates[0])
  //     .setPopup(startPopup)
  //     .addTo(map);

  //   const lastFeature = exampleData.features[featuresLength-1];
  //   const endPopup = new maplibregl.Popup({ textColor: 'black' }).setHTML("<h1 style='color:blue;'>End Point</h1>");
  //   const endPoint = new maplibregl.Marker({ color: 'blue' })
  //     .setLngLat(lastFeature.geometry.coordinates[lastFeature.geometry.coordinates.length-1])
  //     .setPopup(endPopup)
  //     .addTo(map);

  //   map.on('load', ()=> {
  //     map.addSource('some-route', {
  //       type: 'geojson',
  //       data: exampleData
  //     })
  //     map.addLayer({
  //       id: 'route-line',
  //       type: 'line',
  //       source: 'some-route',
  //       paint: {
  //         'line-color': '#ff0000',
  //         'line-width': 4,
  //       },
  //     });

  //   })
    
  //   new maplibregl.Marker({ color: 'blue' })
  //     .setLngLat([20.918591, 52.190228])
  //     .addTo(map);

  //   map.on('dblclick', onDblClick);

  //   return () => map.remove();
  // }, []);

  // return <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />;
  return (
    <Map
      mapStyle="https://tiles.openfreemap.org/styles/bright"
      initialViewState={{
        longitude: 21.006725,
        latitude: 52.231958,
        zoom: 10
      }}
      onDblClick={onDblClick}
      onMouseDown={onRightDblClick}
      style={{ width: '100%', height: '100vh' }}>
      <NavigationControl position='top-right' />
        {children}
      </Map>
  )
}

export default NavMap;