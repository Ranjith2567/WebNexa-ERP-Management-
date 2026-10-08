const PDFDocument = require("pdfkit");

// =====================================================
// CREATE PDF REPORT
// =====================================================

const createPDFReport = async ({
    title = "WebNexa ERP Report",
    columns = [],
    rows = [],
}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 40,
                bufferPages: true,
            });

            const chunks = [];

            doc.on("data", (chunk) => {
                chunks.push(chunk);
            });

            doc.on("end", () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on("error", reject);

            // =================================================
            // TITLE
            // =================================================

            doc
                .fontSize(18)
                .font("Helvetica-Bold")
                .fillColor("#000000")
                .text(title, {
                    align: "center",
                });

            doc.moveDown(1);

            // =================================================
            // REPORT DATE
            // =================================================

            doc
                .fontSize(9)
                .font("Helvetica")
                .fillColor("#000000")
                .text(
                    `Generated: ${new Date().toLocaleString(
                        "en-IN"
                    )}`,
                    {
                        align: "right",
                    }
                );

            doc.moveDown(1);

            // =================================================
            // TABLE CONFIGURATION
            // =================================================

            const pageWidth =
                doc.page.width -
                doc.page.margins.left -
                doc.page.margins.right;

            const columnWidth =
                columns.length > 0
                    ? pageWidth / columns.length
                    : pageWidth;

            const rowHeight = 22;

            let currentY = doc.y;

            // =================================================
            // DRAW TABLE HEADER
            // =================================================

            const drawHeader = () => {
                currentY = doc.y;

                doc
                    .font("Helvetica-Bold")
                    .fontSize(7)
                    .fillColor("#000000");

                columns.forEach(
                    (column, index) => {
                        const x =
                            doc.page.margins.left +
                            index * columnWidth;

                        doc
                            .rect(
                                x,
                                currentY,
                                columnWidth,
                                rowHeight
                            )
                            .fillAndStroke(
                                "#eeeeee",
                                "#999999"
                            );

                        doc
                            .fillColor("#000000")
                            .text(
                                String(
                                    column.header || ""
                                ),
                                x + 3,
                                currentY + 7,
                                {
                                    width:
                                        columnWidth - 6,
                                    height:
                                        rowHeight - 4,
                                    align: "center",
                                    lineBreak: false,
                                }
                            );
                    });

                currentY += rowHeight;
                doc.y = currentY;
            };

            // =================================================
            // DRAW TABLE ROW
            // =================================================

            const drawRow = (row) => {
                if (
                    currentY + rowHeight >
                    doc.page.height -
                        doc.page.margins.bottom
                ) {
                    doc.addPage();

                    currentY =
                        doc.page.margins.top;

                    doc.y = currentY;

                    drawHeader();
                }

                doc
                    .font("Helvetica")
                    .fontSize(6.5)
                    .fillColor("#000000");

                columns.forEach(
                    (column, index) => {
                        const x =
                            doc.page.margins.left +
                            index * columnWidth;

                        let value =
                            row[column.key];

                        if (
                            value === undefined ||
                            value === null
                        ) {
                            value = "";
                        }

                        doc
                            .rect(
                                x,
                                currentY,
                                columnWidth,
                                rowHeight
                            )
                            .stroke("#cccccc");

                        doc
                            .fillColor("#000000")
                            .text(
                                String(value),
                                x + 3,
                                currentY + 7,
                                {
                                    width:
                                        columnWidth - 6,
                                    height:
                                        rowHeight - 4,
                                    ellipsis: true,
                                    lineBreak: false,
                                }
                            );
                    });

                currentY += rowHeight;
                doc.y = currentY;
            };

            // =================================================
            // GENERATE TABLE
            // =================================================

            if (columns.length > 0) {
                drawHeader();

                rows.forEach((row) => {
                    drawRow(row);
                });
            } else {
                doc
                    .fontSize(10)
                    .fillColor("#000000")
                    .text(
                        "No report columns available."
                    );
            }

            // =================================================
            // FOOTER
            // =================================================

            const range =
                doc.bufferedPageRange();

            for (
                let i = range.start;
                i < range.start + range.count;
                i++
            ) {
                doc.switchToPage(i);

                // Safe footer position inside bottom margin
                const footerY =
                    doc.page.height -
                    doc.page.margins.bottom -
                    12;

                doc
                    .font("Helvetica")
                    .fontSize(8)
                    .fillColor("#666666")
                    .text(
                        `WebNexa ERP | Page ${
                            i + 1
                        } of ${range.count}`,
                        doc.page.margins.left,
                        footerY,
                        {
                            align: "center",
                            width:
                                doc.page.width -
                                doc.page.margins.left -
                                doc.page.margins.right,
                            lineBreak: false,
                        }
                    );
            }

            // =================================================
            // END PDF
            // =================================================

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    createPDFReport,
};