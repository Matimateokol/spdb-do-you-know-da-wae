import './DetailsCard.css';

export default function DetailsCard({ routeMetadata, routeNumber, routeColor, hidden, onHideClick }) {
  const travelTime = () => {
    let seconds = routeMetadata.total_time_seconds;

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = (num) => num.toString().padStart(2, '0');

    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return (
    <>
      <div className='cardHeader'
        style={{
          backgroundColor: routeColor
        }}>
        <div id="opacityCheckbox">
          <input type="checkbox" data-index={routeNumber - 1} id={`hideChkbx${routeNumber}`} name="hideChkbx" onChange={onHideClick} checked={hidden} />
          <label for={`hideChkbx${routeNumber}`}>Hide</label><br></br>
        </div>
        <h3 style={{
          color: 'white',
          alignSelf: 'stretch',
          flexBasis: '100%',
          padding: '5px',
          margin: '5px',
        }}>Trasa nr {routeNumber}</h3>
      </div>
      {!hidden &&
        <div className="cardGridContainer">
          <div key="row1" className="cardGridRow">
            <h4 className="header">
              Całkowity dystans w metrach
            </h4>
            <p>{routeMetadata.total_distance_meters}</p>
          </div>
          <div key="row2" className="cardGridRow">
            <h4 className="header">Całkowity czas drogi w sekundach</h4>
            <p>{travelTime()}</p>
          </div>
          <div key="row3" className="cardGridRow">
            <h4 className="header">Prędkość pojazdu (km/h)</h4>
            <p>{routeMetadata.vehicle_speed}</p>
          </div>
          <div key="row4" className="card3GridRow">
            <div className='gridCell'>
              <h4 className="header">Kryterium</h4>
              <p>{routeMetadata.criterion}</p>
            </div>
            <div className='gridCell'>
              <h4 className="header">Czas trwania algorytmu (s)</h4>
              <p>{routeMetadata.algorithm_duration}</p>
            </div>
            <div className='gridCell'>
              <h4 className="header">Czas wykonania zapytania (s)</h4>
              <p>{routeMetadata.function_duration}</p>
            </div>
          </div>
          <div key="row5" className="cardGridRow">
            <h4 className="header">Algorytm</h4>
            <p>{routeMetadata.algorithm}</p>
          </div>
        </div>
      }
    </>
  );
}