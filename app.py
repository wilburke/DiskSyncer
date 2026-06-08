from flask import Flask, render_template, request, jsonify
import os
import hashlib
import threading
from pathlib import Path
from collections import defaultdict
import json

app = Flask(__name__)

# Store scan results and status
scans = {}
scan_counter = 0

def calculate_hash(filepath, chunk_size=8192):
    """Calculate SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(chunk_size), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except (IOError, OSError) as e:
        print(f"Error hashing {filepath}: {e}")
        return None

def find_duplicates(directory, scan_id):
    """Find duplicate files in a directory."""
    try:
        scans[scan_id]['status'] = 'scanning'
        scans[scan_id]['message'] = 'Starting scan...'
        
        file_hashes = defaultdict(list)
        total_files = 0
        processed_files = 0
        
        # First pass: count total files
        for root, dirs, files in os.walk(directory):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            total_files += len(files)
        
        scans[scan_id]['total_files'] = total_files
        
        # Second pass: hash files
        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for filename in files:
                if filename.startswith('.'):
                    continue
                    
                filepath = os.path.join(root, filename)
                processed_files += 1
                
                # Update progress
                scans[scan_id]['processed_files'] = processed_files
                scans[scan_id]['message'] = f'Processing: {filepath}'
                
                file_hash = calculate_hash(filepath)
                if file_hash:
                    file_hashes[file_hash].append({
                        'path': filepath,
                        'size': os.path.getsize(filepath)
                    })
        
        # Find duplicates (files with same hash)
        duplicates = {}
        for file_hash, files in file_hashes.items():
            if len(files) > 1:
                duplicates[file_hash] = files
        
        scans[scan_id]['status'] = 'completed'
        scans[scan_id]['duplicates'] = duplicates
        scans[scan_id]['total_duplicates'] = sum(len(v) - 1 for v in duplicates.values())
        scans[scan_id]['message'] = 'Scan completed successfully'
        
    except Exception as e:
        scans[scan_id]['status'] = 'error'
        scans[scan_id]['message'] = str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def start_scan():
    """Start a new duplicate file scan."""
    global scan_counter
    
    data = request.json
    directory = data.get('directory')
    
    if not directory:
        return jsonify({'error': 'No directory specified'}), 400
    
    if not os.path.isdir(directory):
        return jsonify({'error': 'Directory does not exist'}), 400
    
    scan_id = scan_counter
    scan_counter += 1
    
    scans[scan_id] = {
        'status': 'pending',
        'directory': directory,
        'message': 'Initializing...',
        'processed_files': 0,
        'total_files': 0,
        'duplicates': {},
        'total_duplicates': 0
    }
    
    # Start scan in background thread
    thread = threading.Thread(target=find_duplicates, args=(directory, scan_id))
    thread.daemon = True
    thread.start()
    
    return jsonify({'scan_id': scan_id})

@app.route('/api/scan/<int:scan_id>/status')
def get_scan_status(scan_id):
    """Get the status of a scan."""
    if scan_id not in scans:
        return jsonify({'error': 'Scan not found'}), 404
    
    scan = scans[scan_id]
    return jsonify({
        'scan_id': scan_id,
        'status': scan['status'],
        'directory': scan['directory'],
        'message': scan['message'],
        'processed_files': scan['processed_files'],
        'total_files': scan['total_files'],
        'total_duplicates': scan['total_duplicates']
    })

@app.route('/api/scan/<int:scan_id>/results')
def get_scan_results(scan_id):
    """Get the full results of a completed scan."""
    if scan_id not in scans:
        return jsonify({'error': 'Scan not found'}), 404
    
    scan = scans[scan_id]
    if scan['status'] != 'completed':
        return jsonify({'error': 'Scan not completed yet'}), 400
    
    # Format results for display
    results = []
    for file_hash, files in scan['duplicates'].items():
        results.append({
            'hash': file_hash,
            'count': len(files),
            'size': files[0]['size'],
            'files': [f['path'] for f in files]
        })
    
    return jsonify({
        'scan_id': scan_id,
        'directory': scan['directory'],
        'duplicates': results,
        'total_duplicate_groups': len(results),
        'total_duplicate_files': scan['total_duplicates']
    })

@app.route('/api/scans')
def list_scans():
    """List all scans."""
    scan_list = []
    for scan_id, scan in scans.items():
        scan_list.append({
            'scan_id': scan_id,
            'directory': scan['directory'],
            'status': scan['status'],
            'total_duplicates': scan['total_duplicates']
        })
    return jsonify(scan_list)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
