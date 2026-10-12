const Loader = ({ text = 'Loading...', fullPage = false }) => (
  <div className={`loader ${fullPage ? 'loader--full' : ''}`} role="status" aria-live="polite">
    <span className="spinner" aria-hidden="true" />
    <span>{text}</span>
  </div>
);

export default Loader;
