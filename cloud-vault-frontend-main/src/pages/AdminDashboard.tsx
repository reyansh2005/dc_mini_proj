import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, Server, Activity, BarChart3, Edit } from "lucide-react";
import { FileEditor } from "@/components/FileEditor";

const menuItems = [
  { id: "users", label: "Manage Users", icon: Users },
  { id: "nodes", label: "Storage Nodes", icon: Server },
  { id: "editor", label: "File Editor", icon: Edit },
  { id: "activity", label: "Monitor Activity", icon: Activity },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const mockUsers = [
  { name: "John Doe", email: "john@example.com", role: "User", status: "active" },
  { name: "Jane Smith", email: "jane@example.com", role: "User", status: "active" },
  { name: "Bob Wilson", email: "bob@example.com", role: "Admin", status: "inactive" },
];

const mockNodes = [
  { id: "node-1", name: "Storage Node 1", location: "US-East", status: "online", capacity: "85%" },
  { id: "node-2", name: "Storage Node 2", location: "US-West", status: "online", capacity: "62%" },
  { id: "node-3", name: "Storage Node 3", location: "EU-Central", status: "offline", capacity: "0%" },
];

const mockActivity = [
  { user: "john@example.com", action: "File uploaded", timestamp: "2024-01-15 10:30" },
  { user: "jane@example.com", action: "File downloaded", timestamp: "2024-01-15 09:45" },
  { user: "bob@example.com", action: "User created", timestamp: "2024-01-15 09:15" },
];

export const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("users");

  const renderContent = () => {
    switch (activeMenu) {
      case "users":
        return (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.status as "active" | "inactive"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case "nodes":
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockNodes.map((node) => (
              <Card key={node.id} className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{node.name}</CardTitle>
                    <StatusBadge status={node.status as "online" | "offline"} />
                  </div>
                  <CardDescription>{node.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">{node.capacity}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: node.capacity }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case "editor":
        return <FileEditor />;

      case "activity":
        return (
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Recent user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockActivity.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{activity.user}</TableCell>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell className="text-muted-foreground">{activity.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case "reports":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>Total system storage metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">1.2 TB</div>
                <p className="text-muted-foreground">Total used capacity</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Currently active system users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">42</div>
                <p className="text-muted-foreground">Users online now</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      userRole="admin"
      menuItems={menuItems}
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
    >
      {renderContent()}
    </DashboardLayout>
  );
};