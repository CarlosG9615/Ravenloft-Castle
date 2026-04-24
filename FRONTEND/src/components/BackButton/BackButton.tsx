import { useNavigate } from 'react-router-dom';
import './BackButton.css';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  state?: unknown;
}

export function BackButton({ to, state }: BackButtonProps) {
  const navigate = useNavigate();

   const handleBack = () => {
    if (to) {
      navigate(to, { state });
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <button
      className="back-button"
      onClick={handleBack}
      title="Volver"
    >
     <ArrowLeft size={22} />
    </button>
  );
}