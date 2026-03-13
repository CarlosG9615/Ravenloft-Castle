import 'bootstrap/dist/css/bootstrap.min.css';
import './CharacterSheet.css';

interface Attack {
  name: string;
  bonus: string;
  damage: string;
  type: string;
}

interface Skill {
  name: string;
  stat: string;
  bonus: number;
  proficient: boolean;
}

interface SavingThrow {
  name: string;
  stat: string;
  bonus: number;
  proficient: boolean;
}

const savingThrows: SavingThrow[] = [
  { name: 'Fuerza', stat: 'FUE', bonus: 0, proficient: false },
  { name: 'Destreza', stat: 'DES', bonus: 0, proficient: false },
  { name: 'Constitución', stat: 'CON', bonus: 0, proficient: false },
  { name: 'Inteligencia', stat: 'INT', bonus: 0, proficient: false },
  { name: 'Sabiduría', stat: 'SAB', bonus: 0, proficient: false },
  { name: 'Carisma', stat: 'CAR', bonus: 0, proficient: false },
];

const skills: Skill[] = [
  { name: 'Acrobacias', stat: 'DES', bonus: 0, proficient: false },
  { name: 'Arcanos', stat: 'INT', bonus: 0, proficient: false },
  { name: 'Atletismo', stat: 'FUE', bonus: 0, proficient: false },
  { name: 'Engañar', stat: 'CAR', bonus: 0, proficient: false },
  { name: 'Historia', stat: 'INT', bonus: 0, proficient: false },
  { name: 'Interpretación', stat: 'CAR', bonus: 0, proficient: false },
  { name: 'Intimidar', stat: 'CAR', bonus: 0, proficient: false },
  { name: 'Investigación', stat: 'INT', bonus: 0, proficient: false },
  { name: 'Juego de Manos', stat: 'DES', bonus: 0, proficient: false },
  { name: 'Medicina', stat: 'SAB', bonus: 0, proficient: false },
  { name: 'Naturaleza', stat: 'INT', bonus: 0, proficient: false },
  { name: 'Percepción', stat: 'SAB', bonus: 0, proficient: false },
  { name: 'Perspicacia', stat: 'SAB', bonus: 0, proficient: false },
  { name: 'Persuasión', stat: 'CAR', bonus: 0, proficient: false },
  { name: 'Religión', stat: 'INT', bonus: 0, proficient: false },
  { name: 'Sigilo', stat: 'DES', bonus: 0, proficient: false },
  { name: 'Supervivencia', stat: 'SAB', bonus: 0, proficient: false },
  { name: 'Trato con Animales', stat: 'SAB', bonus: 0, proficient: false },
];

const attacks: Attack[] = [];

export function CharacterSheet() {
  return (
    <div className="sheet-page">
      <div className="container-xl py-4">

        {/* TABS */}
        <ul className="nav sheet-tabs mb-4">
          {['Información', 'Historia', 'Rasgos', 'Equipamiento', 'Conjuros'].map((tab, i) => (
            <li className="nav-item" key={i}>
              <a className={`nav-link sheet-tab ${i === 0 ? 'active' : ''}`} href="#">{tab}</a>
            </li>
          ))}
        </ul>

        {/* FICHA */}
        <div className="sheet-card">

          {/* ── CABECERA ── */}
          <div className="sheet-header row align-items-center mb-4">
            <div className="col-4">
              <div className="sheet-banner-left">
                <div className="sheet-field-row mb-2">
                  <span className="sheet-field-label">Nombre</span>
                  <input className="sheet-input" placeholder="Nombre del personaje" />
                </div>
                <div className="sheet-field-row">
                  <span className="sheet-field-label">Jugador</span>
                  <input className="sheet-input" placeholder="Tu nombre" />
                </div>
              </div>
            </div>
            <div className="col-4 text-center">
              <img
                src="/images/RavenLoft-logo (2).png"
                alt="RavenLoft"
                className="sheet-logo"
              />
            </div>
            <div className="col-4">
              <div className="sheet-banner-right">
                <div className="sheet-field-row mb-2">
                  <span className="sheet-field-label">Clase</span>
                  <input className="sheet-input" placeholder="Ej: Pícaro" />
                </div>
                <div className="sheet-field-row">
                  <span className="sheet-field-label">Raza</span>
                  <input className="sheet-input" placeholder="Ej: Tiefling" />
                </div>
              </div>
            </div>
          </div>

          <hr className="sheet-divider" />

          {/* ── FILA PRINCIPAL ── */}
          <div className="row g-4">

            {/* COLUMNA IZQUIERDA */}
            <div className="col-lg-4">

              {/* CARACTERÍSTICAS */}
              <h6 className="sheet-section-title mb-3">⚔ Características</h6>
              <div className="row g-3 mb-4">
                {[
                  { label: 'FUE', full: 'Fuerza' },
                  { label: 'DES', full: 'Destreza' },
                  { label: 'CON', full: 'Constitución' },
                  { label: 'INT', full: 'Inteligencia' },
                  { label: 'SAB', full: 'Sabiduría' },
                  { label: 'CAR', full: 'Carisma' },
                ].map((stat) => (
                  <div className="col-6" key={stat.label}>
                    <div className="stat-box">
                      <span className="stat-label">{stat.label}</span>
                      <input className="stat-input" placeholder="10" maxLength={2} />
                      <span className="stat-mod">+0</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* INICIATIVA Y VELOCIDAD */}
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="stat-box">
                    <span className="stat-label">INICIATIVA</span>
                    <input className="stat-input" placeholder="+0" maxLength={3} />
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-box">
                    <span className="stat-label">VELOCIDAD</span>
                    <input className="stat-input" placeholder="9m" maxLength={4} />
                  </div>
                </div>
              </div>

              {/* ARMADURA Y COMPETENCIA */}
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="stat-box">
                    <span className="stat-label">CLASE DE ARMADURA</span>
                    <input className="stat-input" placeholder="10" maxLength={2} />
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-box">
                    <span className="stat-label">BONIF. COMPETENCIA</span>
                    <input className="stat-input" placeholder="+2" maxLength={3} />
                  </div>
                </div>
              </div>

              {/* ATAQUES */}
              <h6 className="sheet-section-title mb-3">🗡 Ataques</h6>
              <div className="sheet-table mb-2">
                <div className="sheet-table-header row g-0">
                  <div className="col-5">Nombre</div>
                  <div className="col-3 text-center">Bonif.</div>
                  <div className="col-4 text-center">Daño</div>
                </div>
                {attacks.length === 0 ? (
                  <div className="sheet-table-empty">Sin ataques asignados</div>
                ) : (
                  attacks.map((atk, i) => (
                    <div className="sheet-table-row row g-0" key={i}>
                      <div className="col-5">{atk.name}</div>
                      <div className="col-3 text-center">{atk.bonus}</div>
                      <div className="col-4 text-center">{atk.damage}</div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* COLUMNA CENTRAL */}
            <div className="col-lg-4">

              {/* PUNTOS DE GOLPE Y NIVEL */}
              <div className="row g-3 mb-4">
                <div className="col-8">
                  <div className="hp-box">
                    <span className="hp-label">PUNTOS DE GOLPE</span>
                    <input className="hp-input" placeholder="0" maxLength={3} />
                    <span className="hp-sublabel">máx</span>
                    <input className="hp-input hp-current" placeholder="0" maxLength={3} />
                    <span className="hp-sublabel">actual</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-box">
                    <span className="stat-label">NIVEL</span>
                    <input className="stat-input" placeholder="1" maxLength={2} />
                  </div>
                </div>
              </div>

              {/* TIRADAS DE SALVACIÓN */}
              <h6 className="sheet-section-title mb-3">🛡 Tiradas de Salvación</h6>
              <div className="sheet-table mb-4">
                <div className="sheet-table-header row g-0">
                  <div className="col-8">Nombre</div>
                  <div className="col-4 text-center">Total</div>
                </div>
                {savingThrows.map((st, i) => (
                  <div className="sheet-table-row row g-0 align-items-center" key={i}>
                    <div className="col-8 d-flex align-items-center gap-2">
                      <span className="proficiency-dot"></span>
                      {st.name} ({st.stat})
                    </div>
                    <div className="col-4 text-center">
                      <input className="bonus-input" placeholder="+0" maxLength={3} />
                    </div>
                  </div>
                ))}
              </div>

              {/* INSPIRACIÓN Y PERCEPCIÓN PASIVA */}
              <div className="row g-3">
                <div className="col-6">
                  <div className="stat-box">
                    <span className="stat-label">INSPIRACIÓN</span>
                    <input className="stat-input" placeholder="0" maxLength={2} />
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-box">
                    <span className="stat-label">PERCEPCIÓN PASIVA</span>
                    <input className="stat-input" placeholder="10" maxLength={2} />
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMNA DERECHA */}
            <div className="col-lg-4">

              {/* HABILIDADES */}
              <h6 className="sheet-section-title mb-3">✦ Habilidades</h6>
              <div className="sheet-table">
                <div className="sheet-table-header row g-0">
                  <div className="col-1"></div>
                  <div className="col-7">Habilidad</div>
                  <div className="col-4 text-center">Bonus</div>
                </div>
                {skills.map((skill, i) => (
                  <div className="sheet-table-row row g-0 align-items-center" key={i}>
                    <div className="col-1">
                      <span className="proficiency-dot"></span>
                    </div>
                    <div className="col-7">
                      {skill.name} <span className="skill-stat">({skill.stat})</span>
                    </div>
                    <div className="col-4 text-center">
                      <input className="bonus-input" placeholder="+0" maxLength={3} />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}