import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { DiscordProvider } from './context/discordContext.tsx';

createRoot(document.getElementById("root")!).render(
    <DiscordProvider>
     <App />
    </DiscordProvider>

);
