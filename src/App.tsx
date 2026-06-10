import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';

// ── エラーバウンダリ ──────────────────────────────────────
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-lg w-full rounded-2xl border p-8 text-center"
            style={{ backgroundColor: '#111827', borderColor: '#ef4444' }}>
            <p className="text-2xl mb-3">⚠️</p>
            <p className="font-bold text-white mb-2">レンダリングエラーが発生しました</p>
            <pre className="text-xs text-left overflow-auto mt-4 p-3 rounded-lg"
              style={{ backgroundColor: '#0a0f1e', color: '#f87171', maxHeight: '200px' }}>
              {this.state.error.message}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: '#3b82f6' }}
            >
              再試行
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const HomePage         = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const BlogPage         = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogDetailPage   = lazy(() => import('./pages/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })));
const QuizPage         = lazy(() => import('./pages/QuizPage').then(m => ({ default: m.QuizPage })));
const ProfilePage      = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AdminPage        = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const LessonsPage      = lazy(() => import('./pages/LessonsPage').then(m => ({ default: m.LessonsPage })));
const LessonDetailPage = lazy(() => import('./pages/LessonDetailPage').then(m => ({ default: m.LessonDetailPage })));
const NotFoundPage     = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const QuickQuiz        = lazy(() => import('./pages/QuickQuiz').then(m => ({ default: m.QuickQuiz })));
const QuickQuizResult  = lazy(() => import('./pages/QuickQuizResult').then(m => ({ default: m.QuickQuizResult })));

const PageLoader = () => {
  const isQuiz = window.location.pathname === '/quiz';
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm" style={{ color: '#64748b' }}>
        {isQuiz ? '60問の診断を準備中...' : '読み込み中...'}
      </p>
    </div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <div key={location.pathname} className="page-fade">
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogDetailPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/quiz/quick" element={<QuickQuiz />} />
            <Route path="/quiz/quick/result" element={<QuickQuizResult />} />
            <Route path="/lessons" element={<LessonsPage />} />
            <Route path="/lessons/:id" element={<LessonDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-dvh flex flex-col" style={{ backgroundColor: '#F8F7F2' }}>
        <Header />
        <div className="flex-1">
          <AnimatedRoutes />
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
