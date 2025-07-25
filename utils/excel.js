const xlsx = require('xlsx');
const path = require('path');

const exportToExcel = (data, fileName) => {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Invoices');
  const filePath = path.join(__dirname, '..', 'invoices_excel', `${fileName}.xlsx`);
  xlsx.writeFile(wb, filePath);
};

module.exports = { exportToExcel }; 