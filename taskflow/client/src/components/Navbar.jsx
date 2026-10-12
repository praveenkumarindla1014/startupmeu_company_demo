import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand">
          TaskFlow
        </Link>
        {user && (
          <div className="navbar__user">
            <span className="navbar__name">Hi, {user.name}</span>
            <button type="button" className="btn btn--ghost btn--small" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
