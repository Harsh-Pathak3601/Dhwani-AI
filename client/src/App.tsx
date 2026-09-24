import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import NumberCheck from './components/NumberCheck';
import ConsentBanner from './components/ConsentBanner';
import CallSession from './components/CallSession';
import ReportView from './components/ReportView';
import SecurityCasesDashboard from './components/SecurityCasesDashboard';
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
      className="min-h-dvh"
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
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <RoleProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </RoleProvider>
  );
}

export default App;
