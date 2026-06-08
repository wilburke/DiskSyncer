# DiskSyncer - Duplicate File Finder

A Python web application that scans directories for duplicate files using SHA256 hashing. Built with Flask and a modern HTML/CSS interface.

## Features

- 🔍 **Recursive Directory Scanning**: Scans entire directory trees for duplicate files
- 🔐 **SHA256 Hashing**: Uses cryptographic hashing to reliably identify duplicates
- 📊 **Real-time Progress**: Live progress updates during scanning
- 🎨 **Modern Web Interface**: Beautiful HTML/CSS/JavaScript interface
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Background Processing**: Scans run in background threads without blocking
- 📈 **Detailed Results**: Shows file paths, sizes, hash values, and duplicate counts

## Requirements

- Python 3.7+
- Flask 2.3.3
- Werkzeug 2.3.7

## Installation

1. Clone the repository:
```bash
git clone https://github.com/wilburke/DiskSyncer.git
cd DiskSyncer
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the application:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. Enter a directory path and click "Start Scan"

4. Wait for the scan to complete and review the results

## How It Works

1. **Directory Scanning**: The application recursively walks through the specified directory
2. **File Hashing**: Each file is read in chunks and a SHA256 hash is calculated
3. **Duplicate Detection**: Files with identical hashes are grouped together
4. **Results Display**: Duplicates are displayed with file paths, sizes, and hash values

## API Endpoints

### Start a Scan
```
POST /api/scan
Body: {"directory": "/path/to/directory"}
Response: {"scan_id": 0}
```

### Get Scan Status
```
GET /api/scan/<scan_id>/status
Response: {
  "status": "scanning|completed|error",
  "processed_files": 100,
  "total_files": 200,
  "message": "..."
}
```

### Get Scan Results
```
GET /api/scan/<scan_id>/results
Response: {
  "duplicates": [...],
  "total_duplicate_groups": 5,
  "total_duplicate_files": 12
}
```

### List All Scans
```
GET /api/scans
Response: [{"scan_id": 0, "status": "completed", ...}]
```

## Directory Support

### Linux/macOS
```
/home/user/documents
/Users/username/Pictures
/var/log
```

### Windows
```
C:\Users\Username\Documents
D:\Photos
C:\Program Files
```

## Performance Notes

- File hashing is I/O intensive; performance depends on disk speed
- Hidden directories (starting with `.`) are automatically skipped
- Hidden files (starting with `.`) are automatically skipped
- The application supports scanning directories with thousands of files

## Error Handling

- Invalid directory paths are caught and reported
- Files that cannot be read are skipped with logged errors
- Scan errors are displayed in the UI with detailed messages

## Future Enhancements

- [ ] Delete/merge duplicate files
- [ ] Export results to CSV/JSON
- [ ] Ignore specific file types or patterns
- [ ] Database persistence for scan history
- [ ] Comparison of duplicate groups
- [ ] File preview capability

## License

MIT License - See LICENSE file for details

## Author

Created for DiskSyncer project
