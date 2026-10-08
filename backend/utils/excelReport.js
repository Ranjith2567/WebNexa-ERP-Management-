const ExcelJS = require("exceljs");


// =====================================================
// CREATE EXCEL REPORT
// =====================================================

const createExcelReport = async ({
    title = "WebNexa ERP Report",
    columns = [],
    rows = [],
}) => {

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "WebNexa ERP";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet(
        title.substring(0, 31)
    );


    // =================================================
    // TITLE
    // =================================================

    worksheet.mergeCells(
        1,
        1,
        1,
        columns.length
    );

    const titleCell = worksheet.getCell("A1");

    titleCell.value = title;

    titleCell.font = {
        bold: true,
        size: 16,
    };

    titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    worksheet.getRow(1).height = 30;


    // =================================================
    // HEADER
    // =================================================

    worksheet.getRow(3).values = columns.map(
        (column) => column.header
    );

    const headerRow = worksheet.getRow(3);

    headerRow.font = {
        bold: true,
    };

    headerRow.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    headerRow.height = 25;


    // =================================================
    // DATA
    // =================================================

    rows.forEach((row) => {

        const values = columns.map(
            (column) => row[column.key]
        );

        worksheet.addRow(values);
    });


    // =================================================
    // COLUMN WIDTH
    // =================================================

    columns.forEach((column, index) => {

        const columnNumber = index + 1;

        let maxLength =
            String(column.header || "").length;

        rows.forEach((row) => {

            const value =
                row[column.key];

            if (value !== undefined && value !== null) {

                maxLength = Math.max(
                    maxLength,
                    String(value).length
                );
            }
        });

        worksheet.getColumn(
            columnNumber
        ).width = Math.min(
            Math.max(maxLength + 2, 12),
            40
        );
    });


    // =================================================
    // AUTO FILTER
    // =================================================

    if (columns.length > 0 && rows.length > 0) {

        worksheet.autoFilter = {
            from: {
                row: 3,
                column: 1,
            },
            to: {
                row: 3 + rows.length,
                column: columns.length,
            },
        };
    }


    // =================================================
    // FREEZE HEADER
    // =================================================

    worksheet.views = [
        {
            state: "frozen",
            ySplit: 3,
        },
    ];


    // =================================================
    // RETURN BUFFER
    // =================================================

    const buffer =
        await workbook.xlsx.writeBuffer();

    return buffer;
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createExcelReport,
};