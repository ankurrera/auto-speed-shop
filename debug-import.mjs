import jsPDFModule from 'jspdf';

console.log('jsPDF module:', jsPDFModule);
console.log('Keys:', Object.keys(jsPDFModule));
console.log('Default export:', jsPDFModule.default);
console.log('jsPDF constructor:', jsPDFModule.jsPDF);

// Test different ways to access the constructor
try {
  const pdf1 = new jsPDFModule.default();
  console.log('jsPDFModule.default() works');
} catch (err) {
  console.error('jsPDFModule.default() failed:', err.message);
}

try {
  const pdf2 = new jsPDFModule.jsPDF();
  console.log('jsPDFModule.jsPDF() works');
} catch (err) {
  console.error('jsPDFModule.jsPDF() failed:', err.message);
}

try {
  const pdf3 = new jsPDFModule();
  console.log('jsPDFModule() works');
} catch (err) {
  console.error('jsPDFModule() failed:', err.message);
}