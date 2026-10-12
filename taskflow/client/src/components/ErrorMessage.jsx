// Shows an error with optional "Try again" and dismiss actions
const ErrorMessage = ({ message, onRetry, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="alert alert--error" role="alert">
      <span>{message}</span>
      <div className="alert__actions">
        {onRetry && (
          <button type="button" className="btn btn--small" onClick={onRetry}>
            Try again
          </button>
        )}
        {onDismiss && (
          <button type="button" className="btn-icon" onClick={onDismiss} aria-label="Dismiss error">
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
