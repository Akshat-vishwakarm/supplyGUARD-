import React from 'react';
import { Link, useLocation } from 'wouter';
import { Shield, BarChart3, AlertTriangle, Beaker, Lightbulb, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3,
    description: 'Overview and monitoring'
  },
  {
    name: 'Security Event Monitor',
    href: '/security-events',
    icon: AlertTriangle,
    description: 'Real-time alerts'
  },
  {
    name: 'Scenario Lab',
    href: '/scenario-lab',
    icon: Beaker,
    description: 'Risk simulation'
  },
  {
    name: 'Recommendations',
    href: '/recommendations',
    icon: Lightbulb,
    description: 'Mitigation strategies'
  },
  {
    name: 'Sector Impact',
    href: '/sector-impact',
    icon: BarChart3,
    description: 'Industry analysis'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    description: 'Export and history'
  }
];

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">SecureSupply AI</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Icon className={`${collapsed ? 'mr-0' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
                    {!collapsed && (
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.name}</div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              {!collapsed && <span>LIVE</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}