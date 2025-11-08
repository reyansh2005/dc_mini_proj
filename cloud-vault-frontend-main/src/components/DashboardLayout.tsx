import { Navbar } from "./Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  userRole: "admin" | "user";
  children: React.ReactNode;
  menuItems: MenuItem[];
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
}

export const DashboardLayout = ({ 
  userRole, 
  children, 
  menuItems, 
  activeMenu, 
  onMenuChange 
}: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar userRole={userRole} />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border shadow-card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Menu
            </h2>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeMenu === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    activeMenu === item.id 
                      ? "bg-gradient-primary text-white shadow-primary" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => onMenuChange(item.id)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};