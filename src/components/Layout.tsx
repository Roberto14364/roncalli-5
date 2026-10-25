
import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sostituzioni Docenti</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Connesso come: <strong>{currentUser.username}</strong> ({currentUser.role === 'admin' ? 'Amministratore' : 'Collaboratore'})
            </span>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="bg-blue-700">
          <div className="container mx-auto px-4">
            <ul className="flex flex-wrap">
              <li>
                <Link 
                  to="/" 
                  className={`block px-4 py-3 hover:bg-blue-800 transition ${location.pathname === '/' ? 'bg-blue-800' : ''}`}
                >
                  Sostituzioni
                </Link>
              </li>
              <li>
                <Link 
                  to="/sostituzioni-giornaliere" 
                  className={`block px-4 py-3 hover:bg-blue-800 transition ${location.pathname === '/sostituzioni-giornaliere' ? 'bg-blue-800' : ''}`}
                >
                  Sostituzioni Giornaliere
                </Link>
              </li>
              <li>
                <Link 
                  to="/docenti" 
                  className={`block px-4 py-3 hover:bg-blue-800 transition ${location.pathname === '/docenti' ? 'bg-blue-800' : ''}`}
                >
                  Docenti
                </Link>
              </li>
              <li>
                <Link 
                  to="/permessi" 
                  className={`block px-4 py-3 hover:bg-blue-800 transition ${location.pathname === '/permessi' ? 'bg-blue-800' : ''}`}
                >
                  Permessi Docenti
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-gray-200 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-600">
          &copy; {new Date().getFullYear()} - Sistema Gestione Sostituzioni Docenti
        </div>
      </footer>
    </div>
  );
};
