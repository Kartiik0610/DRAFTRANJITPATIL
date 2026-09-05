# How to Manage Downloads (`JS/downloads.js`)

This guide explains how to add, edit, or delete subjects and study materials in the Downloads section of the website. All the data for the downloads page is stored in `JS/downloads.js` inside the `subjects` array.

---

## 1. Understanding the Structure

Open `JS/downloads.js` in your code editor. You will see a `subjects` array that looks like this:

```javascript
const subjects = [
  {
    title: "Subject Name (Course Code)",
    ongoing: true,
    fullDownload: "",
    items: [
      { 
        label: "Module 1", 
        fileId: "YOUR_FILE_LINK_OR_ID", 
        type: "unit" 
      },
      // ... more items
    ]
  },
  // ... more subjects
];
```

### Subject Properties
- **`title`**: The name of the subject (e.g., "Manufacturing Processes").
- **`ongoing`**: Set to `true` if it's a current semester subject. If `false`, it might be filtered out depending on how the page is viewed.
- **`fullDownload`**: A link for a button to download all notes at once (optional).
- **`items`**: An array of objects representing individual files/links (like syllabus, modules, assignments).

### Item Properties
Inside the `items` array, every entry is surrounded by curly braces `{}` and needs specific properties:
- **`label`**: The text users will click on (e.g., "Module 1", "Assignment 1").
- **`fileId`**: The URL (e.g., a SharePoint link) or the Google Drive file ID.
- **`type`**: Determines where the item is grouped on the page. Valid types include:
  - `"syllabus"` (Syllabus)
  - `"unit"` (Units/Modules)
  - `"rubric"` (Assessment Rubrics)
  - `"experiment"` (Experiments)
  - `"assignment"` (Assignments)
  - `"topic"` or `"session"` (Topics / Sessions)
  - `"form"` (Forms / Documents)
- **`disabled`** (Optional): Set to `true` (e.g., `disabled: true`) to lock the item so it cannot be clicked (shows a 🔒 icon).
- **`ss`** (Optional): Set to `true` (e.g., `ss: true`) for "Self Study" modules (also locked and unclickable).

---

## 2. How to Add a New Item (Note/Assignment)

1. Find the subject in `JS/downloads.js` where you want to add the file.
2. Inside its `items` array, add a new block `{ ... }`.
3. Fill in the details. Don't forget the comma `,` at the end if it's not the last item!

**Example: Adding Module 3**
```javascript
{ 
  label: "Module 3", 
  fileId: "https://svkmmumbai-my.sharepoint.com/...your-link-here...", 
  type: "unit" 
},
```

## 3. How to Update an Existing Item

1. Find the item you want to change.
2. To change the name, edit the `"label"` property.
3. To change the file link, update the string inside `"fileId"`.
4. To make a locked item available, remove `, disabled: true` from the item.

**Example: Unlocking an assignment and adding a link**
*Before:*
```javascript
{ label: "Assignment 5", fileId: "", type: "assignment", disabled:true },
```
*After:*
```javascript
{ label: "Assignment 5", fileId: "https://svkmmumbai-my.sharepoint.com/...new-link...", type: "assignment" },
```

## 4. How to Delete an Item

To delete an item, simply remove its entire block from `{` to `},`. 

For example, delete these lines completely:
```javascript
{ 
  label: "Old Assignment", 
  fileId: "some-link", 
  type: "assignment" 
},
```

## 5. How to Add a Completely New Subject

1. Scroll to the bottom of the `subjects` array (before the closing `];`).
2. Copy an existing subject block, or paste the template below.
3. Update the title and items.

```javascript
{
  title: "New Subject (NS101)",
  ongoing: true,
  fullDownload: "",
  items: [
    { label: "Syllabus", fileId: "link-here", type: "syllabus" },
    { label: "Module 1", fileId: "link-here", type: "unit" }
  ]
},
```

## ⚠️ Important Rules to Avoid Errors

1. **Commas are crucial**: In JavaScript, items in a list must be separated by commas. If you add a new item, ensure the previous one ends with a comma `},`. The very last item in the array does not strictly need a comma, but having one is safe.
2. **Quotes matter**: Make sure `label` and `fileId` values are wrapped in double quotes `" "` or single quotes `' '`.
3. **Save your work**: After modifying `JS/downloads.js`, save the file, then refresh your web browser to see the changes.
