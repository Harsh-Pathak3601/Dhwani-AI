import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import NumberCheck from './components/NumberCheck';
import ConsentBanner from './components/ConsentBanner';
import CallSession from './components/CallSession';
import ReportView from './components/ReportView';
import SecurityCasesDashboard from './components/SecurityCasesDashboard';
import ArchitectureView from './components/ArchitectureView';
import EnterpriseApiPortal from './components/EnterpriseApiPortal';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { RoleProvider } from './context/RoleContext';

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    filter: 'blur(4px)',
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-dvh w-full max-w-full min-w-0"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <NumberCheck />
            </PageWrapper>
          }
        />
        <Route
          path="/app"
          element={
            <PageWrapper>
              <NumberCheck />
            </PageWrapper>
          }
        />
        <Route
          path="/check"
          element={
            <PageWrapper>
              <NumberCheck />
            </PageWrapper>
          }
        />
        <Route
          path="/consent"
          element={
            <PageWrapper>
              <ConsentBanner />
            </PageWrapper>
          }
        />
        <Route
          path="/session"
          element={
            <PageWrapper>
              <CallSession />
            </PageWrapper>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageWrapper>
              <SecurityCasesDashboard />
            </PageWrapper>
          }
        />
        <Route
          path="/report"
          element={
            <PageWrapper>
              <ReportView />
            </PageWrapper>
          }
        />
        <Route
          path="/architecture"
          element={
            <PageWrapper>
              <ArchitectureView />
            </PageWrapper>
          }
        />
        <Route
          path="/enterprise-api"
          element={
            <PageWrapper>
              <EnterpriseApiPortal />
            </PageWrapper>
          }
        />
        <Route
          path="/integrations"
          element={
            <PageWrapper>
              <EnterpriseApiPortal />
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function Layout() {
  const location = useLocation();
  const isCockpit = location.pathname.startsWith('/session');

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B2A] text-white relative w-full max-w-full overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black max-w-full">
        <iframe
          src="/nexus-cyber.html"
          title="Nexus Cyber Background"
          className="w-full h-full border-0 pointer-events-none scale-100 opacity-90 block"
          style={{ width: '100%', height: '100%', maxWidth: '100vw' }}
          tabIndex={-1}
          aria-hidden="true"
        />
        {/* Subtle atmospheric vignette ensuring high-tech depth and text legibility */}
        <div className="absolute inset-0 bg-[#070b10]/40 backdrop-blur-[0.5px] pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen flex-1 w-full max-w-full min-w-0">
        <Navbar />
        <div className="flex-1 flex flex-col w-full max-w-full min-w-0 pt-20 sm:pt-24">
          <AnimatedRoutes />
        </div>
        {!isCockpit && <Footer />}
      </div>
    </div>
  );
}

function App() {
  return (
    <RoleProvider>
      <Router>
        <Layout />
      </Router>
    </RoleProvider>
  );
}

export default App;
