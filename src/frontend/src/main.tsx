import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './App';

dayjs.extend(relativeTime);

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

registerSW({
  onNeedRefresh() {},
  onOfflineReady() {},
});
