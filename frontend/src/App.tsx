import StudentDashboard from './pages/StudentDashboard';
import StudentLayout from './components/StudentLayout';

export default function App() {
  return (
    <StudentLayout>
      <StudentDashboard />
    </StudentLayout>
  );
}
