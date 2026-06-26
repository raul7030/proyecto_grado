// src/layouts/PublicLayout.jsx
import { Outlet } from 'react-router-dom';
import PublicNavBar from '../components/PublicNavBar';
import PublicFooter from '../components/PublicFooter';

const PublicLayout = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            
            <PublicNavBar />
            
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
            
            <PublicFooter />
            
        </div>
    );
};

export default PublicLayout;