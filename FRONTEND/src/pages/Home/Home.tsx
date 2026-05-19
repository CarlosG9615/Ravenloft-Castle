import { useEffect, useRef, useState, useCallback } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface Feature {
  iconSrc: string;
  title: string;
  description: string;
  route: string;
}

export function Home() {
  const navigate = useNavigate();
  const cardsRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carouselImages = [
    { src: '/images/carrousel_image1.png', alt: 'Unirse a Campañas', desc: 'Encuentra tu grupo de aventureros y únete a campañas épicas.' },
    { src: '/images/carrousel_image2.png', alt: 'Misiones', desc: 'Completa misiones y desafíos para ganar experiencia y recompensas.' },
    { src: '/images/carrousel_image3.png', alt: 'Diario de Campaña', desc: 'Registra cada sesión y guarda los momentos más épicos de tu aventura.' },
    { src: '/images/carrousel_image4.png', alt: 'Mapas Interactivos', desc: 'Explora mundos detallados con mapas dinámicos y fog of war.' },
  ];

  const goTo = useCallback((index: number) => {
    setCarouselIndex((index + carouselImages.length) % carouselImages.length);
  }, [carouselImages.length]);

  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCarouselIndex(i => (i + 1) % carouselImages.length);
    }, 5000);
  }, [carouselImages.length]);

  useEffect(() => {
    resetInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [resetInterval]);

  const handlePrev = () => { goTo(carouselIndex - 1); resetInterval(); };
  const handleNext = () => { goTo(carouselIndex + 1); resetInterval(); };

  // Observer para las cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('.feature-card');
            cards.forEach((card) => card.classList.add('visible'));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (cardsRef.current) observer.observe(cardsRef.current);
    return () => observer.disconnect();
  }, []);

  const features: Feature[] = [
    {
      iconSrc: '/images/icons/icon-character.png',
      title: 'Crea Personajes',
      description: 'Fichas personalizables y gestión de inventario.',
      route: '/characters'
    },
    {
      iconSrc: '/images/icons/icon-dice.png',
      title: 'Juega con Amigos',
      description: 'Salas privadas y chat de voz integrado. Únete a grupos, comparte historias y encuentra DMs.',
      route: '/join'
    },
    {
      iconSrc: '/images/icons/icon-mapa.png',
      title: 'Mapas Interactivos',
      description: 'Tableros dinámicos con fog of war. Sistema de dados y mucho más.',
      route: '/tools'
    },
  ];

  return (
    <>
      <section className="hero-landing">
        <div className="hero-content">
          <img
            src="/images/RavenLoft-logo (2).png"
            alt="Ravenloft Castle"
            className="hero-logo"
          />
          <button className="hero-cta" onClick={() => navigate('/role-select')}>
            Comenzar Aventura
          </button>
          <p className="about-text">
            Las puertas del castillo se abren ante ti.<br />
            Forja tu destino, lidera a tus aliados y desafía la oscuridad.<br />
            Tu leyenda comienza aquí.
          </p>
        </div>
      </section>

      <section className="about-section">

        <div className="features-grid" ref={cardsRef}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              onClick={() => navigate(feature.route!)}
            >
              <img src={feature.iconSrc} alt={feature.title} className="feature-icon-img" />
              <div className="feature-title">{feature.title}</div>
              <div className="feature-desc">{feature.description}</div>
            </div>
          ))}
        </div>

        {/* ── CARRUSEL ESTILO FOUNDRY ── */}
        <div className="carousel-section">
          <h3 className="carousel-title">Herramientas de la Plataforma</h3>

          <div className="fvtt-carousel">

            {/* FLECHA IZQUIERDA */}
            <button className="fvtt-arrow fvtt-arrow--left" onClick={handlePrev}>
              <ChevronLeft size={40} />
            </button>

            {/* SLIDES */}
            <div className="fvtt-slides">
              {carouselImages.map((image, index) => (
                <div
                  key={index}
                  className={`fvtt-slide ${index === carouselIndex ? 'active' : ''}`}
                >
                  <img src={image.src} alt={image.alt} className="fvtt-slide-img" />
                  <div className="fvtt-slide-overlay" />
                  <div className="fvtt-slide-info">
                    <h2 className="fvtt-slide-titulo">{image.alt}</h2>
                    <p className="fvtt-slide-desc">{image.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FLECHA DERECHA */}
            <button className="fvtt-arrow fvtt-arrow--right" onClick={handleNext}>
              <ChevronRight size={40} />
            </button>

            {/* DOTS */}
            <div className="fvtt-dots">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  className={`fvtt-dot ${index === carouselIndex ? 'active' : ''}`}
                  onClick={() => { goTo(index); resetInterval(); }}
                />
              ))}
            </div>

          </div>
        </div>

      </section>
    </>
  );
}