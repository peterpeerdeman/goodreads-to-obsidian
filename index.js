const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

fs.createReadStream("goodreads_library_export.csv")
  .pipe(csv())
  .on("data", (row) => {
    // Create a markdown file for each book
    if (row["Exclusive Shelf"] != "read") {
      return;
    }
    const mdContent = `---
author: ${row.Author}
title: ${row.Title}
date: ${row["Date Read"]}
tag: #bookreview
rating: ${row["My Rating"] || "No rating given"}
---

# ${row.Title} by ${row.Author}

## Review

${row["My Review"] || "No review available"}
`;

    const filePath = path.join(__dirname, `${row["Title"]}.md`);
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, "utf8", function (err, data) {
        if (err) throw err;
        // Check if the existing file already contains a frontmatter block
        if (!data.startsWith("---")) {
          const newContent = mdContent + "\n" + data;
          fs.writeFile(filePath, newContent, (err) => {
            if (err) throw err;
            console.log(
              `Markdown file for book ${row["Title"]} has been updated.`
            );
          });
        } else {
          console.log(
            `Markdown file for book ${row["Title"]} already contains a frontmatter block.`
          );
        }
      });
    } else {
      fs.writeFile(filePath, mdContent, (err) => {
        if (err) throw err;
        console.log(`Markdown file for book ${row["Title"]} has been created.`);
      });
    }
    // fs.writeFile(`${row["Title"]}.md`, mdContent, (err) => {
    //   if (err) throw err;
    //   console.log(`Markdown file for book ${row["Book Id"]} has been created.`);
    // });
  })
  .on("end", () => {
    console.log("CSV file successfully processed");
  });
