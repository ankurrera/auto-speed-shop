import jsPDF from 'jspdf';

console.log('jsPDF imported successfully:', typeof jsPDF);

// Test creating a PDF instance
try {
  const pdf = new jsPDF();
  console.log('jsPDF instance created successfully');
} catch (err) {
  console.error('Error creating jsPDF instance:', err.message);
}