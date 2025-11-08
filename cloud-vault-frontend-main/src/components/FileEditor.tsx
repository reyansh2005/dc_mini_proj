import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, FolderOpen, Code, Image, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

const mockFiles = [
  { name: "document.txt", type: "text", content: "This is a sample text document.\n\nYou can edit this content and save your changes. The distributed file storage system will automatically sync your changes across all nodes.", icon: FileText },
  { name: "script.js", type: "javascript", content: "// JavaScript file\nfunction greetUser(name) {\n  console.log(`Hello, ${name}!`);\n  return `Welcome to the system, ${name}`;\n}\n\n// Example usage\nconst userName = 'John';\ngreetUser(userName);", icon: Code },
  { name: "README.md", type: "markdown", content: "# Project Documentation\n\n## Overview\nThis is a distributed file storage system that allows you to:\n\n- Upload files securely\n- Access files from anywhere\n- Edit files in real-time\n- Collaborate with team members\n\n## Features\n- **Distributed Architecture**: Files are replicated across multiple nodes\n- **Real-time Editing**: Edit documents directly in your browser\n- **Version Control**: Track changes and restore previous versions", icon: FileText },
  { name: "config.json", type: "json", content: "{\n  \"system\": {\n    \"name\": \"Distributed File Storage\",\n    \"version\": \"1.0.0\",\n    \"nodes\": [\n      \"node-1.storage.com\",\n      \"node-2.storage.com\",\n      \"node-3.storage.com\"\n    ],\n    \"replication\": 3,\n    \"compression\": true,\n    \"encryption\": \"AES-256\"\n  },\n  \"user\": {\n    \"maxFileSize\": \"100MB\",\n    \"allowedTypes\": [\"txt\", \"js\", \"json\", \"md\", \"csv\"]\n  }\n}", icon: Code }
];

export const FileEditor = () => {
  const [selectedFile, setSelectedFile] = useState<typeof mockFiles[0] | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("text");
  const { toast } = useToast();

  const handleFileSelect = (file: typeof mockFiles[0]) => {
    setSelectedFile(file);
    setFileContent(file.content);
    setHasUnsavedChanges(false);
  };

  const handleContentChange = (content: string) => {
    setFileContent(content);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (selectedFile) {
      toast({
        title: "File Saved",
        description: `${selectedFile.name} has been saved successfully across all storage nodes.`,
      });
      setHasUnsavedChanges(false);
    }
  };

  const handleCreateNewFile = () => {
    if (newFileName.trim()) {
      const newFile = {
        name: newFileName,
        type: newFileType,
        content: `// New ${newFileType} file\n\n`,
        icon: newFileType === "javascript" ? Code : FileText
      };
      handleFileSelect(newFile);
      setNewFileName("");
      toast({
        title: "New File Created",
        description: `${newFileName} has been created and is ready for editing.`,
      });
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "javascript":
      case "json":
        return Code;
      case "csv":
        return FileSpreadsheet;
      case "image":
        return Image;
      default:
        return FileText;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* File Browser */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Files
          </CardTitle>
          <CardDescription>Select a file to edit or create a new one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create New File */}
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">Create New File</h4>
            <Input
              placeholder="filename.txt"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <Select onValueChange={setNewFileType} defaultValue="text">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text File (.txt)</SelectItem>
                <SelectItem value="javascript">JavaScript (.js)</SelectItem>
                <SelectItem value="json">JSON (.json)</SelectItem>
                <SelectItem value="markdown">Markdown (.md)</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleCreateNewFile}
              disabled={!newFileName.trim()}
              size="sm"
              className="w-full"
            >
              Create File
            </Button>
          </div>

          {/* File List */}
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Recent Files</h4>
            {mockFiles.map((file, index) => {
              const IconComponent = file.icon;
              return (
                <Button
                  key={index}
                  variant={selectedFile?.name === file.name ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 h-auto p-3",
                    selectedFile?.name === file.name && "bg-gradient-primary"
                  )}
                  onClick={() => handleFileSelect(file)}
                >
                  <IconComponent className="w-4 h-4 shrink-0" />
                  <div className="text-left overflow-hidden">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-xs opacity-70 capitalize">{file.type}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* File Editor */}
      <Card className="lg:col-span-2 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {selectedFile ? (
                  <>
                    <selectedFile.icon className="w-5 h-5" />
                    {selectedFile.name}
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    No file selected
                  </>
                )}
              </CardTitle>
              {selectedFile && (
                <CardDescription className="capitalize">
                  {selectedFile.type} file • {hasUnsavedChanges ? "Unsaved changes" : "Saved"}
                </CardDescription>
              )}
            </div>
            
            {selectedFile && (
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className="bg-gradient-primary hover:shadow-primary transition-all duration-300"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedFile ? (
            <Textarea
              value={fileContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[400px] font-mono text-sm resize-none"
              placeholder="Start typing to edit your file..."
            />
          ) : (
            <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No file selected</p>
                <p>Choose a file from the browser or create a new one to start editing</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};