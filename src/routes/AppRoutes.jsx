import { Routes, Route, BrowserRouter } from 'react-router-dom';
import PainelTriagem from '../pages/PainelTriagem';
import { Settings } from '../pages/Settings';

export function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<PainelTriagem />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </BrowserRouter>
    )
}