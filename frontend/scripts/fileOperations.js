/**
 * File Operations Manager
 * Handles file uploads, downloads, and management
 */

class FileOperationsManager {
    constructor() {
        this.fileList = [];
        this.uploadQueue = [];
        this.isUploading = false;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
        this.allowedTypes = ['*']; // Allow all file types for simulation
        
        this.initializeFileOperations();
    }

    /**
     * Initialize file operation event listeners
     */
    initializeFileOperations() {
        this.setupUploadArea();
        this.setupFileControls();
        this.setupFilePreview();
    }

    /**
     * Setup drag and drop upload area
     */
    setupUploadArea() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (!uploadArea || !fileInput) return;

        // Click to select files
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
            e.target.value = ''; // Reset input
        });

        // Drag and drop events
        uploadArea.addEventListener('dragenter', this.handleDragEnter.bind(this));
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
    }

    /**
     * Setup file control buttons
     */
    setupFileControls() {
        const refreshBtn = document.getElementById('refreshFiles');
        const searchInput = document.getElementById('fileSearch');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshFileList();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterFiles(e.target.value);
            });
        }
    }

    /**
     * Setup file preview modal
     */
    setupFilePreview() {
        const modal = document.getElementById('filePreviewModal');
        const closeBtn = document.getElementById('closePreview');
        const downloadBtn = document.getElementById('downloadPreviewFile');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePreviewModal();
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadPreviewFile();
            });
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closePreviewModal();
                }
            });
        }
    }

    /**
     * Handle drag enter event
     */
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.add('drag-over');
        }
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('drag-over');
        }
    }

    /**
     * Handle file drop event
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('drag-over');
        }
        
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
    }

    /**
     * Handle selected files for upload
     */
    handleFiles(files) {
        if (!files || files.length === 0) return;

        // Validate files
        const validFiles = files.filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            Toast.show('No valid files selected', 'warning');
            return;
        }

        // Add to upload queue
        validFiles.forEach(file => {
            const uploadItem = {
                id: Date.now() + Math.random(),
                file: file,
                progress: 0,
                status: 'pending'
            };
            this.uploadQueue.push(uploadItem);
        });

        this.updateUploadProgress();
        this.processUploadQueue();
    }

    /**
     * Validate file before upload
     */
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            Toast.show(`File too large: ${file.name} (Max: ${this.formatFileSize(this.maxFileSize)})`, 'error');
            return false;
        }

        // For simulation, allow all file types
        return true;
    }

    /**
     * Process upload queue
     */
    async processUploadQueue() {
        if (this.isUploading || this.uploadQueue.length === 0) return;

        this.isUploading = true;

        while (this.uploadQueue.length > 0) {
            const uploadItem = this.uploadQueue.shift();
            await this.uploadFile(uploadItem);
        }

        this.isUploading = false;
        this.hideUploadProgress();
    }

    /**
     * Upload a single file
     */
    async uploadFile(uploadItem) {
        try {
            uploadItem.status = 'uploading';
            this.updateUploadProgress();

            // Read file content
            const fileContent = await this.readFileContent(uploadItem.file);
            
            // Simulate upload progress
            await this.simulateUploadProgress(uploadItem);
            
            // Send to server
            const message = `UPLOAD ${uploadItem.file.name} ${fileContent}`;
            const success = WSManager.send(message);
            
            if (success) {
                uploadItem.status = 'completed';
                uploadItem.progress = 100;
                Logger.log('info', 'File', `Uploaded: ${uploadItem.file.name}`);
                Toast.show(`File uploaded: ${uploadItem.file.name}`, 'success');
                
                // Update logical clock
                LogicalClock.increment('File Upload');
                
                // Refresh file list after a delay
                setTimeout(() => {
                    this.refreshFileList();
                }, 500);
            } else {
                throw new Error('Upload failed - not connected');
            }
            
        } catch (error) {
            uploadItem.status = 'error';
            Logger.log('error', 'File', `Upload failed: ${uploadItem.file.name} - ${error.message}`);
            Toast.show(`Upload failed: ${uploadItem.file.name}`, 'error');
        }
        
        this.updateUploadProgress();
    }

    /**
     * Read file content as base64
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
                // Convert to base64
                const base64 = btoa(reader.result);
                resolve(base64);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsBinaryString(file);
        });
    }

    /**
     * Simulate upload progress for better UX
     */
    simulateUploadProgress(uploadItem) {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 90) {
                    progress = 90;
                    clearInterval(interval);
                    resolve();
                }
                uploadItem.progress = Math.min(progress, 90);
                this.updateUploadProgress();
            }, 100);
        });
    }

    /**
     * Update upload progress display
     */
    updateUploadProgress() {
        const progressContainer = document.getElementById('uploadProgress');
        if (!progressContainer) return;

        if (this.uploadQueue.length === 0 && !this.isUploading) {
            progressContainer.classList.remove('active');
            return;
        }

        progressContainer.classList.add('active');
        progressContainer.innerHTML = '';

        // Show all upload items (queue + completed recently)
        const allItems = [...this.uploadQueue];
        
        allItems.forEach(item => {
            const itemElement = this.createUploadItemElement(item);
            progressContainer.appendChild(itemElement);
        });
    }

    /**
     * Create upload item element
     */
    createUploadItemElement(item) {
        const element = document.createElement('div');
        element.className = 'upload-item';
        
        element.innerHTML = `
            <div class="upload-item-name">${item.file.name}</div>
            <div class="upload-item-progress">
                <div class="upload-item-progress-fill" style="width: ${item.progress}%"></div>
            </div>
            <div class="upload-item-status">${this.getUploadStatusText(item)}</div>
        `;
        
        return element;
    }

    /**
     * Get upload status text
     */
    getUploadStatusText(item) {
        switch (item.status) {
            case 'pending':
                return 'Waiting...';
            case 'uploading':
                return `${Math.round(item.progress)}%`;
            case 'completed':
                return '✓ Done';
            case 'error':
                return '✗ Error';
            default:
                return '';
        }
    }

    /**
     * Hide upload progress
     */
    hideUploadProgress() {
        setTimeout(() => {
            const progressContainer = document.getElementById('uploadProgress');
            if (progressContainer) {
                progressContainer.classList.remove('active');
            }
        }, 2000);
    }

    /**
     * Refresh file list from server
     */
    refreshFileList() {
        Logger.log('info', 'File', 'Refreshing file list');
        
        // Send list request to server
        const success = WSManager.send('LIST');
        
        if (!success) {
            Toast.show('Cannot refresh files - not connected', 'warning');
            return;
        }
        
        // The actual file list will be received via WebSocket and handled by updateFileList()
        // No need for mock data here anymore
    }

    /**
     * Update file list display
     */
    updateFileList(files) {
        this.fileList = files;
        this.renderFileList();
    }

    /**
     * Render file list
     */
    renderFileList() {
        const fileListContainer = document.getElementById('fileList');
        if (!fileListContainer) return;

        if (this.fileList.length === 0) {
            fileListContainer.innerHTML = '<div class="no-files">No files available</div>';
            return;
        }

        const filteredFiles = this.getFilteredFiles();
        
        if (filteredFiles.length === 0) {
            fileListContainer.innerHTML = '<div class="no-files">No files match your search</div>';
            return;
        }

        fileListContainer.innerHTML = '';
        
        filteredFiles.forEach(file => {
            const fileElement = this.createFileElement(file);
            fileListContainer.appendChild(fileElement);
        });
    }

    /**
     * Create file list item element
     */
    createFileElement(file) {
        const element = document.createElement('div');
        element.className = 'file-item';
        
        // Debug the date formatting
        try {
            const formattedDate = this.formatDate(file.modified);
            console.log('Formatting date for file:', file.name, 'Original date:', file.modified, 'Formatted:', formattedDate);
            
            element.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span>${this.formatFileSize(file.size)}</span>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn" data-action="view" data-file="${file.name}">
                        👁️ View
                    </button>
                    <button class="file-action-btn" data-action="download" data-file="${file.name}">
                        📥 Download
                    </button>
                    <button class="file-action-btn" data-action="delete" data-file="${file.name}">
                        🗑️ Delete
                    </button>
                </div>
            `;
        } catch (error) {
            console.error('Error creating file element for:', file, 'Error:', error);
            // Fallback with safe date
            element.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span>${this.formatFileSize(file.size)}</span>
                        <span>Unknown</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn" data-action="view" data-file="${file.name}">
                        👁️ View
                    </button>
                    <button class="file-action-btn" data-action="download" data-file="${file.name}">
                        📥 Download
                    </button>
                    <button class="file-action-btn" data-action="delete" data-file="${file.name}">
                        🗑️ Delete
                    </button>
                </div>
            `;
        }
        
        // Add event listeners for file actions
        this.setupFileActions(element, file);
        
        return element;
    }

    /**
     * Setup file action event listeners
     */
    setupFileActions(element, file) {
        const actionButtons = element.querySelectorAll('.file-action-btn');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                const filename = button.dataset.file;
                
                switch (action) {
                    case 'view':
                        this.viewFile(filename);
                        break;
                    case 'download':
                        this.downloadFile(filename);
                        break;
                    case 'delete':
                        this.deleteFile(filename);
                        break;
                }
            });
        });
    }

    /**
     * View file content
     */
    viewFile(filename) {
        Logger.log('info', 'File', `Viewing file: ${filename}`);
        
        const message = `VIEW ${filename}`;
        const success = WSManager.send(message);
        
        if (success) {
            // Listen for file content response
            WSManager.on('fileView', (content) => {
                this.showFilePreview(filename, content);
            });
            
            LogicalClock.increment('File View');
        } else {
            Toast.show('Cannot view file - not connected', 'warning');
        }
    }

    /**
     * Download file
     */
    downloadFile(filename) {
        Logger.log('info', 'File', `Downloading file: ${filename}`);
        
        const message = `DOWNLOAD ${filename}`;
        const success = WSManager.send(message);
        
        if (success) {
            // Listen for file content response
            WSManager.on('fileContent', (content) => {
                this.triggerFileDownload(filename, content);
            });
            
            LogicalClock.increment('File Download');
        } else {
            Toast.show('Cannot download file - not connected', 'warning');
        }
    }

    /**
     * Delete file
     */
    deleteFile(filename) {
        const confirmed = confirm(`Are you sure you want to delete "${filename}"?`);
        
        if (!confirmed) return;
        
        Logger.log('info', 'File', `Deleting file: ${filename}`);
        
        const message = `DELETE ${filename}`;
        const success = WSManager.send(message);
        
        if (success) {
            LogicalClock.increment('File Delete');
        } else {
            Toast.show('Cannot delete file - not connected', 'warning');
        }
    }

    /**
     * Show file preview modal
     */
    showFilePreview(filename, content) {
        const modal = document.getElementById('filePreviewModal');
        const filenameElement = document.getElementById('previewFileName');
        const contentElement = document.getElementById('previewContent');
        
        if (!modal || !filenameElement || !contentElement) return;
        
        filenameElement.textContent = filename;
        
        try {
            // Decode base64 content
            const decodedContent = atob(content);
            
            // Determine how to display the content
            const fileExtension = filename.split('.').pop().toLowerCase();
            
            if (['txt', 'js', 'css', 'html', 'json', 'xml', 'md'].includes(fileExtension)) {
                // Text-based files
                contentElement.innerHTML = `<pre><code>${this.escapeHtml(decodedContent)}</code></pre>`;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
                // Images
                contentElement.innerHTML = `<img src="data:image/${fileExtension};base64,${content}" alt="${filename}" style="max-width: 100%; height: auto;">`;
            } else {
                // Other files
                contentElement.innerHTML = `
                    <div class="binary-file-preview">
                        <p>📄 Binary file: ${filename}</p>
                        <p>Size: ${content.length} bytes</p>
                        <p>Use download button to save the file.</p>
                    </div>
                `;
            }
            
        } catch (error) {
            contentElement.innerHTML = '<div class="error-message">Error displaying file content</div>';
        }
        
        modal.classList.add('animate-scale-in');
        modal.style.display = 'flex';
        
        // Store current file for download
        this.currentPreviewFile = { filename, content };
    }

    /**
     * Close preview modal
     */
    closePreviewModal() {
        const modal = document.getElementById('filePreviewModal');
        if (modal) {
            modal.classList.add('animate-scale-out');
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('animate-scale-in', 'animate-scale-out');
            }, 300);
        }
        this.currentPreviewFile = null;
    }

    /**
     * Download file from preview
     */
    downloadPreviewFile() {
        if (this.currentPreviewFile) {
            this.triggerFileDownload(
                this.currentPreviewFile.filename, 
                this.currentPreviewFile.content
            );
        }
    }

    /**
     * Trigger browser file download
     */
    triggerFileDownload(filename, base64Content) {
        try {
            // Convert base64 to blob
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes]);
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            Toast.show(`Downloaded: ${filename}`, 'success');
            
        } catch (error) {
            Logger.log('error', 'File', `Download failed: ${error.message}`);
            Toast.show('Download failed', 'error');
        }
    }

    /**
     * Filter files based on search term
     */
    filterFiles(searchTerm) {
        this.currentSearchTerm = searchTerm.toLowerCase();
        this.renderFileList();
    }

    /**
     * Get filtered files based on search term
     */
    getFilteredFiles() {
        if (!this.currentSearchTerm) {
            return this.fileList;
        }
        
        return this.fileList.filter(file =>
            file.name.toLowerCase().includes(this.currentSearchTerm)
        );
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        try {
            // Handle both string and Date objects
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            
            // Check if the date is valid
            if (isNaN(dateObj.getTime())) {
                return 'Unknown';
            }
            
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(dateObj);
        } catch (error) {
            console.warn('Error formatting date:', error, 'Original value:', date);
            return 'Unknown';
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.FileManager = new FileOperationsManager();