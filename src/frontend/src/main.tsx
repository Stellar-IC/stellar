import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as ReactDOM from 'react-dom/client';

import App from './App';
import './db';

dayjs.extend(relativeTime);

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
