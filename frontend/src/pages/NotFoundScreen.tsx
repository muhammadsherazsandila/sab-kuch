import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
      <p className="text-6xl mb-4">🔍</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-500 text-sm mb-8">The page you're looking for doesn't exist.</p>
      <Button onClick={() => navigate('/')}>
        <Home size={16} className="mr-2" /> Go Home
      </Button>
    </div>
  );
}
