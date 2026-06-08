## Duplicate File Manager

A Node.js utility for finding, comparing, and managing duplicate files in your repository.

### Features

✅ **Content-based comparison** - Uses MD5 hashing to identify identical files  
✅ **Interactive management** - Choose to delete, keep, or skip duplicates  
✅ **Smart filtering** - Ignore specific file types and directory patterns  
✅ **File previews** - View file content before taking action  
✅ **Batch operations** - Handle multiple duplicate groups efficiently  

### Installation

No external dependencies required. Uses only Node.js built-in modules.

```bash
# Copy the script to your repo
cp duplicate-file-manager.js /path/to/your/repo
```

### Usage

#### Basic Usage

```bash
node duplicate-file-manager.js
```

This launches the interactive menu:

```
╔════════════════════════════════════════════════════════╗
║   DiskSyncer - Duplicate File Manager                 ║
╚════════════════════════════════════════════════════════╝

Options:
  1. Scan for duplicates
  2. Configure ignore patterns
  3. Exit

Select option (1-3):
```

#### Option 1: Scan for Duplicates

Select option `1` to scan your repository. The tool will:
- Recursively scan all directories
- Hash each file's content (MD5)
- Group identical files together
- Display results sorted by file size

**Output Example:**

```
═══════════════════════════════════════════════════════════
  DUPLICATE FILES FOUND
═══════════════════════════════════════════════════════════

[Group 1] Hash: 3d5d8e92f4c21a8d5e92f4c21a8d5e92
Size: 15.50 KB
Files:
  1. src/utils/helper.js
  2. src/backup/helper.js
  3. lib/helper.js

[Group 2] Hash: 7f2c1e49a8d3f5b2c1e49a8d3f5b2c1e
Size: 2.30 KB
Files:
  1. config/settings.json
  2. backup/settings.json
```

#### Option 2: Configure Ignore Patterns

Customize which files and directories to exclude from scanning.

**Default ignored patterns:**
- `node_modules`
- `.git`
- `.env`
- `dist`
- `build`
- `.DS_Store`
- `*.log`
- `.idea`
- `.vscode`

When prompted, add custom patterns:

```
Current ignore patterns:
  1. node_modules
  2. .git
  ...

Add custom ignore pattern? (pattern or press Enter to skip): custom_backup
✓ Added: custom_backup
```

### Interactive Management

After scanning, you can manage duplicates interactively:

```
Action: [v]iew, [k]eep, [d]elete, [s]kip, [q]uit?
```

#### Commands

| Command | Action |
|---------|--------|
| **v** | View file preview (first 10 lines) |
| **k** | Keep one file, delete others in the group |
| **d** | Delete a specific file |
| **s** | Skip this group |
| **q** | Quit without saving changes |

#### Example Interactive Session

```
[Group 1/3]
Hash: 3d5d8e92f4c21a8d5e92f4c21a8d5e92
Size: 15.50 KB

Files:
  1. src/utils/helper.js
  2. src/backup/helper.js
  3. lib/helper.js

Action: [v]iew, [k]eep, [d]elete, [s]kip, [q]uit? v
View file (1-3): 1

--- src/utils/helper.js ---
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Parse error:', e);
  }
}
---

Action: [v]iew, [k]eep, [d]elete, [s]kip, [q]uit? k
Keep file number (1-3): 1

Keeping: src/utils/helper.js
Deleting:
  - src/backup/helper.js
  - lib/helper.js
Confirm deletion? (yes/no): yes
✓ Deleted: src/backup/helper.js
✓ Deleted: lib/helper.js
```

### How It Works

1. **File Scanning** - Recursively traverses the directory tree
2. **Ignore Filtering** - Skips files matching ignore patterns
3. **Content Hashing** - Generates MD5 hash of each file's content
4. **Duplicate Detection** - Groups files with identical hashes
5. **User Interaction** - Prompts for action on each duplicate group
6. **Safe Deletion** - Confirms before deleting any files

### Configuration

Edit the config object in the script to customize:

```javascript
const config = {
  ignorePatterns: [
    'node_modules',
    '.git',
    // Add your custom patterns here
  ],
  ignoreExtensions: [
    '.lock',
    '.cache'
  ],
  rootDir: process.cwd()
};
```

### Safety Features

✅ **Confirmation prompts** - Always asks before deleting  
✅ **Preview capability** - View files before action  
✅ **Interactive workflow** - Decide on each group separately  
✅ **Error handling** - Gracefully handles read/permission errors  

### Examples

#### Find duplicates only in source code

```
When prompted for ignore patterns, add:
  tests
  examples
  docs
```

#### Keep production files, delete backups

When managing duplicates:
```
Files:
  1. src/config.js (PRODUCTION)
  2. backup/config.js
  3. old/config.js

Keep file number (1-3): 1
```

### Limitations

- Binary files are hashed but not previewed
- Very large files may impact performance
- File content comparison only (not by name or date)

### License

MIT
