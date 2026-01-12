import './Loader.css';

export function Loader() {
  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="loader-slots">
          <span className="loader-seven">7</span>
          <span className="loader-seven">7</span>
          <span className="loader-seven">7</span>
        </div>
        <div className="loader-bar">
          <div className="loader-progress"></div>
        </div>
        <p className="loader-text">Loading...</p>
      </div>
    </div>
  );
}
