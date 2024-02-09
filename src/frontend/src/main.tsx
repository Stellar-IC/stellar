import * as ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

registerSW({
  onNeedRefresh() {},
  onOfflineReady() {},
});
