import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileText, History, Edit } from "lucide-react";
import { FileEditor } from "@/components/FileEditor";

const menuItems = [
  { id: "upload", label: "Upload File", icon: Upload },
  { id: "download", label: "Download File", icon: Download },
  { id: "editor", label: "File Editor", icon: Edit },
  { id: "view", label: "View File Content", icon: FileText },
  { id: "history", label: "File History", icon: History },
];

const mockFileHistory = [
  { filename: "document.pdf", size: "2.3 MB", uploadDate: "2024-01-15" },
  { filename: "image.jpg", size: "1.8 MB", uploadDate: "2024-01-14" },
  { filename: "spreadsheet.xlsx", size: "856 KB", uploadDate: "2024-01-13" },
];

export const UserDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [viewFilename, setViewFilename] = useState("");
  const [fileContent, setFileContent] = useState("");
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast({
            title: "Upload Complete",
            description: `${selectedFile.name} has been uploaded successfully.`,
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDownload = () => {
    if (downloadFilename.trim()) {
      toast({
        title: "Download Successful",
        description: `${downloadFilename} has been downloaded successfully.`,
      });
      setDownloadFilename("");
    }
  };

  const handleViewFile = () => {
    if (viewFilename.trim()) {
      setFileContent(`This is the content of ${viewFilename}.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "upload":
        return (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>Select a file to upload to the distributed storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>
              
              {selectedFile && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
              
              {isUploading && (
                <div className="space-y-2">
                  <Label>Upload Progress</Label>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
                </div>
              )}
              
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-gradient-primary hover:shadow-primary transition-all duration-300"
              >
                {isUploading ? "Uploading..." : "Upload File"}
              </Button>
            </CardContent>
          </Card>
        );

      case "download":
        return (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Download File</CardTitle>
              <CardDescription>Enter filename to download from distributed storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="download-filename">Filename</Label>
                <Input
                  id="download-filename"
                  placeholder="document.pdf"
                  value={downloadFilename}
                  onChange={(e) => setDownloadFilename(e.target.value)}
                />
              </div>
              
              <Button
                onClick={handleDownload}
                disabled={!downloadFilename.trim()}
                className="bg-gradient-accent hover:shadow-accent transition-all duration-300"
              >
                Download File
              </Button>
            </CardContent>
          </Card>
        );

      case "editor":
        return <FileEditor />;

      case "view":
        return (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>View File Content</CardTitle>
              <CardDescription>Preview file content without downloading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="view-filename">Filename</Label>
                <Input
                  id="view-filename"
                  placeholder="document.txt"
                  value={viewFilename}
                  onChange={(e) => setViewFilename(e.target.value)}
                />
              </div>
              
              <Button
                onClick={handleViewFile}
                disabled={!viewFilename.trim()}
                variant="outline"
              >
                View Content
              </Button>
              
              {fileContent && (
                <div className="mt-4">
                  <Label>File Content</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{fileContent}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "history":
        return (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>File History</CardTitle>
              <CardDescription>Your recent file uploads and downloads</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFileHistory.map((file, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{file.filename}</TableCell>
                      <TableCell>{file.size}</TableCell>
                      <TableCell className="text-muted-foreground">{file.uploadDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      userRole="user"
      menuItems={menuItems}
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
    >
      {renderContent()}
    </DashboardLayout>
  );
};