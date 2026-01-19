export default function AdditionalInfoPanel({children}) {
    return (
      <div style={{backgroundColor: '#fff', maxWidth: '100%'}}>
        <span style={{color: 'black', fontWeight: 'bold'}}>
          Informacje dodatkowe
        </span>
        {children}
      </div>
    );
}