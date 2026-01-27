import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Radio, 
  Store, 
  ListMusic, 
  Megaphone, 
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Volume2,
  Users,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { getRoleLabel } from '@/lib/supabase-types';

const getMenuItems = (isAdmin: boolean, isManager: boolean) => {
  const items = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'manager', 'operator'] },
    { icon: Store, label: 'Lojas', path: '/stores', roles: ['admin', 'manager'] },
    { icon: ListMusic, label: 'Playlists', path: '/playlists', roles: ['admin', 'manager'] },
    { icon: Megaphone, label: 'Avisos', path: '/announcements', roles: ['admin', 'manager'] },
    { icon: Users, label: 'Usuários', path: '/users', roles: ['admin', 'manager'] },
    { icon: Volume2, label: 'Player', path: '/player', roles: ['admin', 'manager', 'operator'] },
    { icon: Settings, label: 'Configurações', path: '/settings', roles: ['admin', 'manager'] },
  ];

  if (isAdmin) {
    return items;
  } else if (isManager) {
    return items.filter(item => item.roles.includes('manager'));
  } else {
    return items.filter(item => item.roles.includes('operator'));
  }
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile, role, signOut, isAdmin, isManager } = useAuth();

  const menuItems = getMenuItems(isAdmin, isManager);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300',
        'bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Radio className="w-6 h-6 text-primary" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-foreground">Ágape Play</h1>
            <p className="text-xs text-muted-foreground">Som que conecta marcas 
              e pessoas</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent group',
                isActive && 'bg-sidebar-accent text-sidebar-primary',
                !isActive && 'text-sidebar-foreground'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-primary' : 'text-sidebar-foreground group-hover:text-primary'
                )} 
              />
              {!collapsed && (
                <span className="font-medium animate-fade-in">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && profile && (
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile.full_name}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>{role ? getRoleLabel(role) : 'Carregando...'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>

          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="flex-1 text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
