import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('✓ React application initializing...');
console.log('✓ Theme colors: Primary Blue (#0056B3), Gold (#FFD700)');
console.log('✓ Mode: Development');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('✓ React DOM mounted successfully');