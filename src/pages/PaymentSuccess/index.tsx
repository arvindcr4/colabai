import React from 'react';
import { createRoot } from 'react-dom/client';
import { PaymentSuccess } from './PaymentSuccess';
import '../../styles.css';

const container = document.getElementById('app-container');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <PaymentSuccess />
  </React.StrictMode>
);
