import React, { useRef, useEffect, useState } from 'react';
import { Map, NavigationControl } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Popup } from '@vis.gl/react-maplibre';
import exampleGEOJSON from '../assets/exampleGEOJSON.json';


function NavMap({onDblClick, onRightDblClick, children }) {
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
      style={{ width: '100%', height: '100%' }}>
      <NavigationControl position='top-right' />
        {children}
      </Map>
  )
}

export default NavMap;