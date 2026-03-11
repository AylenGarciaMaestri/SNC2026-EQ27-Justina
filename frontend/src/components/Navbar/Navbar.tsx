import { useState } from 'react';
import type { FC } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import logoWhite from '../../assets/logo-white.svg';

interface NavbarProps {}

const Navbar: FC<NavbarProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Lógica de visibilidad dinámica
  let navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Results', path: '/results' },
  ];

  if (currentPath === '/simulation') {
    navItems = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Results', path: '/results' },
      { name: 'Simulation', path: '/simulation' },
      { name: 'Settings', path: '/settings' },
    ];
  } else if (currentPath === '/settings') {
    navItems = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Results', path: '/results' },
      { name: 'Settings', path: '/settings' },
    ];
  }

  const activeStyles = "bg-sky-950 text-white px-4 py-2 rounded-full font-bold shadow-sm";
  const inactiveStyles = "text-white/90 hover:text-white px-4 py-2 transition-colors font-medium";

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem("auth_user_name");
      navigate('/login');
    }
  };

  return (
    <nav className="bg-cyan-800 shadow-lg p-3 border border-cyan-700/50 relative z-50">
      <div className="flex justify-around items-center px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logoWhite} alt="Justina" className="h-6 w-auto" />
          </Link>
        </div>

        {/* Grupo Derecha: Links + Perfil */}
        <div className="flex items-center gap-4">
          {/* Links para Desktop */}
          <div className="hidden md:flex items-center space-x-2 mr-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => (isActive ? activeStyles : inactiveStyles)}
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="hidden sm:block relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="hover:opacity-80 transition-opacity focus:outline-none"
            >
              <div className="h-9 w-9 bg-sky-950 rounded-full flex items-center justify-center border border-white/20">
                <svg className="h-5 w-5 text-cyan-200" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </div>
            </button>

            {/* Menú Desplegable de Perfil */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl py-2 border border-slate-100 origin-top-right transition-all">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800">Mi Cuenta</p>
                </div>
                <Link 
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-cyan-800 transition-colors"
                >
                  Configuración
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors border-t border-slate-100"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white focus:outline-none"
          >
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              {isOpen ? (
                <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 01-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 01-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 011.414-1.414l4.829 4.828 4.828-4.828a1 1 0 111.414 1.414l-4.828 4.829 4.828 4.828z" />
              ) : (
                <path fillRule="evenodd" d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 space-y-1 border-t border-white/10 pt-4 flex flex-col">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `block px-4 py-2 rounded-lg text-center font-medium ${isActive ? 'bg-sky-950 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`
              }
            >
              {item.name}
            </NavLink>
          ))}
          <Link to="/settings" className={`block px-4 py-2 text-white/80 hover:bg-white/10 hover:text-white rounded-lg text-center ${currentPath === '/settings' ? 'bg-sky-950 text-white' : ''}`} onClick={() => setIsOpen(false)}>
            Settings
          </Link>
          <button 
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }} 
            className="block w-full text-center px-4 py-2 mt-2 text-rose-300 font-bold hover:bg-white/10 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
