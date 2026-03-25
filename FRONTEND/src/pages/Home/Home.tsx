import { useEffect, useRef } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';

interface Feature {
  iconSrc: string;
  title: string;
  description: string;
  route: string;
}

export function Home() {
  const navigate = useNavigate();
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Añade la clase 'visible' a cada card cuando entra en pantalla
          const cards = entry.target.querySelectorAll('.feature-card');
          cards.forEach((card) => card.classList.add('visible'));
          observer.unobserve(entry.target); // ← deja de observar tras animar
        }
      });
    },
    { threshold: 0.1 ,
      rootMargin: '0px 0px -50px 0px'
    } 
    
  );

  if (cardsRef.current) {
    observer.observe(cardsRef.current);
  }

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
  const carouselImages = [
    { src: '/images/screenshot-join.png', alt: 'Unirse a partida' },
    { src: '/images/screenshot-ficha.png', alt: 'Ficha de personaje' },
    { src: '/images/screenshot-diario.png', alt: 'Diario de aventuras' },
    { src: '/images/screenshot-mapas.png', alt: 'Mapas interactivos' },
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
          <a href="#" className="hero-cta">Comenzar Aventura</a>
          <p className="about-text">
          Las puertas del castillo se abren ante ti.<br/>
          Forja tu destino, lidera a tus aliados y desafía la oscuridad.<br/>
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
              
               <img 
                src={feature.iconSrc} 
                alt={feature.title} 
                className="feature-icon-img"
              />
              <div className="feature-title">{feature.title}</div>
              <div className="feature-desc">{feature.description}</div>
            </div>
          ))}
        </div>
        <div className="carousel-section">
          <h3 className="carousel-title">Herramientas de la Plataforma</h3>
          <div className="carousel">
            <div className="carousel-track">
              {carouselImages.map((image, index) => (
                <div 
                  key={index} 
                  className="carousel-item"
                  style={{ minWidth: '400px', width: '400px', height: '250px', flexShrink: 0 }}
                >
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    style={{ width: '400px', height: '250px', objectFit: 'cover', display: 'block' }}
                  />
                  <p className="carousel-caption">{image.alt}</p>
                </div>
              ))}
               {/* BLOQUE 2 — duplicado */}
              {carouselImages.map((image, index) => (
                <div 
                  key={index} 
                  className="carousel-item"
                  style={{ minWidth: '400px', width: '400px', height: '250px', flexShrink: 0 }}
                >
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    style={{ width: '400px', height: '250px', objectFit: 'cover', display: 'block' }}
                  />
                  <p className="carousel-caption">{image.alt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}