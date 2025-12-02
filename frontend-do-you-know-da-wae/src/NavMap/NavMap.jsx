import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Popup } from '@vis.gl/react-maplibre';

function NavMap() {
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [21.006725, 52.231958],
      zoom: 10,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const startPopup = new maplibregl.Popup({ textColor: 'black' }).setHTML("<h1 style='color:red;'>Start Point</h1>");
    const startPoint = new maplibregl.Marker({ color: 'red' })
      .setLngLat([21.006725, 52.231958 ])
      .setPopup(startPopup)
      .addTo(map);
    
    new maplibregl.Marker({ color: 'blue' })
      .setLngLat([20.918591, 52.190228])
      .addTo(map);

    return () => map.remove();
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '50vh' }} />;
}

export default NavMap;