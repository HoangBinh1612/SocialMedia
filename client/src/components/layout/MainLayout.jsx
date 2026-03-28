import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import './MainLayout.css';

export default function MainLayout() {
  const location = useLocation();
  const path = location.pathname;

  const isAdminPage = path === '/admin';
  const isFeedPage = path === '/feed';
  const isChatPage = path === '/chat';

  // Admin has its own full layout
  if (isAdminPage) {
    return <Outlet />;
  }

  // Only show RightSidebar on /feed
  const showRightSidebar = isFeedPage;
  const isSearchPage = path.startsWith('/search');

  return (
    <div>
      <Topbar />
      <div className={'layout-premium' + (!showRightSidebar ? ' no-right-sidebar' : '') + (isSearchPage ? ' search-layout' : '')}>
        {!isSearchPage && <LeftSidebar />}
        <div className={'center-feed-premium' + (!showRightSidebar ? ' expanded' : '')}>
          <Outlet />
        </div>
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
}
