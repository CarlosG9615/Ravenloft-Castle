import { useNavigate } from 'react-router-dom';
import './BackButton.css';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const navigate = useNavigate();

   const handleBack = () => {
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