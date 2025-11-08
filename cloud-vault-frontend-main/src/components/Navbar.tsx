import { Button } from "@/components/ui/button";
import { LogOut, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  userRole?: "admin" | "user";
}

export const Navbar = ({ userRole }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <nav className="bg-card border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Distributed File Storage
              </h1>
              {userRole && (
                <p className="text-xs text-muted-foreground capitalize">
                  {userRole} Dashboard
                </p>
              )}
            </div>
          </div>

          {userRole && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};