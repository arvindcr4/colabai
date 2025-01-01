import React from 'react';
import { createRoot } from 'react-dom/client';
import SubscriptionPopup from './SubscriptionPopup';
import '../../styles.css';

const container = document.getElementById('subscription-root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <SubscriptionPopup />
  </React.StrictMode>
);
