const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const sanitize = require("sanitize-filename");
const fuzzball = require("fuzzball");

fs.createReadStream("goodreads_library_export.csv")
  .pipe(csv())
  .on("data", (row) => {
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

    const cleanTitle = sanitize(row["Title"]);
    const directoryPath = __dirname;
    const files = fs.readdirSync(directoryPath);
    const similarFiles = files.filter(
      (file) => fuzzball.ratio(cleanTitle, file) > 60
    ); // Adjust ratio as needed

    let filePath;
    if (similarFiles.length > 0) {
      console.log(`Similar file found: ${cleanTitle} == ${similarFiles[0]}`);
      filePath = path.join(directoryPath, similarFiles[0]);
    } else {
      filePath = path.join(directoryPath, `${cleanTitle}.md`);
    }

    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, "utf8", function (err, data) {
        if (err) throw err;
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
  })
  .on("end", () => {
    console.log("CSV file successfully processed");
  });
