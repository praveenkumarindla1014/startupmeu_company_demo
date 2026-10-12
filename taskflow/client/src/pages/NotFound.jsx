import { Link } from 'react-router-dom';

const NotFound = () => (
  <main className="auth-page">
    <div className="auth-card card not-found">
      <h1>404</h1>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn--primary">
        Go to dashboard
      </Link>
    </div>
  </main>
);

export default NotFound;
