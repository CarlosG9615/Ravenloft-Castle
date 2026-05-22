import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Layer, Rect, Stage, Text, Image as KonvaImage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useImage from 'use-image';
import type { MapConfig } from '../hooks/useBoardGrid';
import { useBoardGrid } from '../hooks/useBoardGrid';
import { ModalAlert } from '../../../components/ModalAlert/ModalAlert';
import { StoryModeDiceRoller } from './StoryModeDiceRoller';
import './GameBoard.css';

// Suprimir errores de canvas de use-image (son warnings, no críticos)
const originalError = console.error;
const suppressDrawImageErrors = (...args: any[]) => {
  const errorMsg = String(args[0] || '');
  // Solo suprimir errores específicos de drawImage que no rompen la funcionalidad
  if (errorMsg.includes('drawImage') && errorMsg.includes('width or height of 0')) {
    return;
  }
  originalError.apply(console, args);
};
console.error = suppressDrawImageErrors as any;

export interface BoardToken {
  id: string;
  col: number;
  row: number;
  color: string;
  initials: string;
  avatarUrl?: string;
  movement: number;
}

export interface EnemyBoardToken {
  instanciaId: string;
  nombre: string;
  col: number;
  row: number;
  movement?: number;
}

export interface TrapBoardToken {
  instanciaId: string;
  nombre: string;
  imageUrl: string;
  col: number;
  row: number;
}

interface GameBoardProps {
  mapConfig: MapConfig;
  tokens: BoardToken[];
  onTokenMove?: (id: string, col: number, row: number) => void;
  jugadores?: any[];
  turnoActual?: { turnoActualPersonajeId: string | number | null; fase: 'personajes' | 'master' } | null;
  sendFinTurno?: (personajeId: string | number) => void;
  jugadorActual?: any;
  miPersonajeId?: string;
  movimientoRoll?: number | null;
  onMovimientoUsed?: (steps: number) => void;
  enemyTokens?: EnemyBoardToken[];
  trapTokens?: TrapBoardToken[];
  esMaster?: boolean;
  revealedRooms?: string[];
  onRoomRevealed?: (roomId: string) => void;
  onEnemyMove?: (instanciaId: string, col: number, row: number) => void;
  onMasterFinTurno?: () => void;
  nombreMaster?: string;
  onActiveEnemiesChange?: (ids: Set<string>) => void;
  onOpenEnemyDetails?: (instanciaId: string) => void;
  onTrapTriggered?: (instanciaId: string, outcome: 'daño' | 'superado') => void;
  blockedCells?: Map<string, string>;
  revealedTrapIds?: Set<string>;
  onCellBlocked?: (col: number, row: number, imageUrl: string) => void;
  onPlayerTokenClick?: (token: BoardToken) => void;
}

interface Size { width: number; height: number; }
interface PanPoint { x: number; y: number; }
type CellPosition = { col: number; row: number };
type TurnSide = 'personajes' | 'master';
type MovePreviewKind = 'player' | 'enemy';

interface ConflictState {
  tokenId: string;
  tokenName: string;
  enemyId: string;
  enemyName: string;
  attacker: 'personaje' | 'enemigo';
  defender: 'personaje' | 'enemigo';
}

type DoorType = 'normal' | 'secret' | 'double';

interface Door {
  trigger: { col: number; row: number };
  target: { col: number; row: number };
  type: DoorType;
  roomId: string;
  linkedDoorId?: string;
}

interface Room {
  id: string;
  colStart: number;
  rowStart: number;
  colEnd: number;
  rowEnd: number;
  extraCells?: { colStart: number; rowStart: number; colEnd: number; rowEnd: number }[];
  revealed: boolean;
}

const ROOMS: Room[] = [
  { id: 'sala1',  colStart: 9, rowStart: 14, colEnd: 11, rowEnd: 18, revealed: false },
  { id: 'sala2',  colStart: 14, rowStart: 14, colEnd: 17, rowEnd: 18, revealed: false },
  { id: 'sala3',  colStart:  5, rowStart: 10, colEnd:  8, rowEnd: 18, revealed: false },
  { id: 'sala4a', colStart: 18, rowStart: 15, colEnd: 19, rowEnd: 18, revealed: false },
  { id: 'sala4b', colStart: 17, rowStart: 10, colEnd: 19, rowEnd: 14, revealed: false },
  { id: 'sala5',  colStart: 20, rowStart: 10, colEnd: 23, rowEnd: 13, revealed: false },
  { id: 'sala6',  colStart: 20, rowStart: 14, colEnd: 23, rowEnd: 18, revealed: false },
  { id: 'sala7',  colStart:  1, rowStart: 10, colEnd:  4, rowEnd: 18, revealed: false },
  { id: 'sala8',  colStart: 10, rowStart:  7, colEnd: 15, rowEnd: 12, revealed: false },
  { id: 'sala9',  colStart:  1, rowStart:  5, colEnd:  4, rowEnd:  8, revealed: false },
  { id: 'sala10', colStart:  1, rowStart:  1, colEnd:  4, rowEnd:  4, revealed: false },
  { id: 'sala11', colStart:  5, rowStart:  5, colEnd:  8, rowEnd:  8, revealed: false },
  { id: 'sala12', colStart:  5, rowStart:  1, colEnd:  8, rowEnd:  4, revealed: false },
  { id: 'sala13', colStart:  9, rowStart:  1, colEnd: 11, rowEnd:  5, revealed: false },
  { id: 'sala14', colStart: 14, rowStart:  1, colEnd: 16, rowEnd:  5, revealed: false },
  { id: 'sala15', colStart: 17, rowStart:  1, colEnd: 19, rowEnd:  4, revealed: false },
  { id: 'sala16', colStart: 17, rowStart:  5, colEnd: 18, rowEnd:  8, revealed: false },
  { id: 'sala17', colStart: 19, rowStart:  5, colEnd: 23, rowEnd:  8, revealed: false },
  { id: 'sala18', colStart: 20, rowStart:  1, colEnd: 23, rowEnd:  4, revealed: false },
];

const DOORS: Door[] = [
  { trigger: { col: 10, row: 19 }, target: { col: 10, row: 18 }, type: 'normal', roomId: 'sala1' },
  { trigger: { col: 16, row: 19 }, target: { col: 16, row: 18 }, type: 'normal', roomId: 'sala2' },
  { trigger: { col:  6, row: 19 }, target: { col:  6, row: 18 }, type: 'normal', roomId: 'sala3' },
  { trigger: { col:  6, row:  9 }, target: { col:  6, row: 10 }, type: 'normal', roomId: 'sala3' },
  { trigger: { col: 19, row: 19 }, target: { col: 19, row: 18 }, type: 'normal', roomId: 'sala4a' },
  { trigger: { col: 19, row: 15 }, target: { col: 19, row: 14 }, type: 'normal', roomId: 'sala4b' },
  { trigger: { col: 17, row:  9 }, target: { col: 17, row: 10 }, type: 'normal', roomId: 'sala4b' },
  { trigger: { col: 20, row:  9 }, target: { col: 20, row: 10 }, type: 'normal', roomId: 'sala5' },
  { trigger: { col: 22, row: 19 }, target: { col: 22, row: 18 }, type: 'secret', roomId: 'sala6' },
  { trigger: { col:  1, row: 19 }, target: { col:  1, row: 18 }, type: 'secret', roomId: 'sala7' },
  { trigger: { col:  4, row: 10 }, target: { col:  4, row:  9 }, type: 'secret', roomId: 'sala7' },
  { trigger: { col: 12, row: 13 }, target: { col: 12, row: 12 }, type: 'normal', roomId: 'sala8' },
  { trigger: { col: 12, row:  6 }, target: { col: 12, row:  6 }, type: 'double', roomId: 'sala8', linkedDoorId: 'door_sala8_n2' },
  { trigger: { col: 13, row:  6 }, target: { col: 13, row:  6 }, type: 'double', roomId: 'sala8', linkedDoorId: 'door_sala8_n1' },
  { trigger: { col:  2, row:  9 }, target: { col:  2, row:  8 }, type: 'normal', roomId: 'sala9' },
  { trigger: { col:  2, row:  5 }, target: { col:  2, row:  4 }, type: 'normal', roomId: 'sala10' },
  { trigger: { col:  3, row:  0 }, target: { col:  3, row:  1 }, type: 'normal', roomId: 'sala10' },
  { trigger: { col:  6, row:  9 }, target: { col:  6, row:  8 }, type: 'normal', roomId: 'sala11' },
  { trigger: { col:  6, row:  5 }, target: { col:  6, row:  4 }, type: 'normal', roomId: 'sala12' },
  { trigger: { col:  6, row:  0 }, target: { col:  6, row:  1 }, type: 'normal', roomId: 'sala12' },
  { trigger: { col: 10, row:  6 }, target: { col: 10, row:  5 }, type: 'normal', roomId: 'sala13' },
  { trigger: { col:  9, row:  0 }, target: { col:  9, row:  1 }, type: 'secret', roomId: 'sala13' },
  { trigger: { col: 15, row:  6 }, target: { col: 15, row:  5 }, type: 'normal', roomId: 'sala14' },
  { trigger: { col: 15, row:  0 }, target: { col: 15, row:  1 }, type: 'normal', roomId: 'sala14' },
  { trigger: { col: 18, row:  0 }, target: { col: 18, row:  1 }, type: 'double', roomId: 'sala15', linkedDoorId: 'door_sala15_2' },
  { trigger: { col: 19, row:  0 }, target: { col: 19, row:  1 }, type: 'double', roomId: 'sala15', linkedDoorId: 'door_sala15_1' },
  { trigger: { col: 18, row:  5 }, target: { col: 18, row:  4 }, type: 'normal', roomId: 'sala16' },
  { trigger: { col: 16, row:  7 }, target: { col: 17, row:  7 }, type: 'normal', roomId: 'sala16' },
  { trigger: { col: 21, row:  9 }, target: { col: 21, row:  8 }, type: 'normal', roomId: 'sala17' },
  { trigger: { col: 21, row:  5 }, target: { col: 21, row:  4 }, type: 'normal', roomId: 'sala18' },
  { trigger: { col: 21, row:  0 }, target: { col: 21, row:  1 }, type: 'normal', roomId: 'sala18' },
];

const ALWAYS_WALKABLE = new Set<string>([
  '12,13','12,14','12,15','12,16','12,17','12,18','12,19',
  '12,17','13,17',
  '12,18','13,18',
  '9,19','10,19','11,19','12,19','13,19',
  '9,13','10,13','11,13','12,13','13,13','14,13',
]);

const ENEMY_MOVEMENT: Record<string, number> = {
  goblin: 7,
  zombie: 5,
};

function getNormalizedName(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
}

function classifyTrap(nombre: string, imageUrl: string): 'bomba' | 'cepo' | 'derrumbe' | 'other' {
  const norm = getNormalizedName(nombre);
  const url  = imageUrl.toLowerCase();
  if (norm.includes('bomba')    || url.includes('bomba'))    return 'bomba';
  if (norm.includes('cepo')     || url.includes('cepo'))     return 'cepo';
  if (norm.includes('derrumbe') || norm.includes('derrumbamiento') ||
      url.includes('bloqueo')   || url.includes('derrumbe')) return 'derrumbe';
  return 'other';
}

function getTrapTexts(nombre: string, imageUrl: string): { title: string; message: string } {
  const tipo = classifyTrap(nombre, imageUrl);
  if (tipo === 'bomba')    return { title: '\u00a1Has pisado una bomba!',  message: 'Lanza el dado para intentar esquivar la explosi\u00f3n.' };
  if (tipo === 'cepo')     return { title: '\u00a1Has ca\u00eddo en un cepo!',  message: 'Lanza el dado para intentar escapar del cepo.' };
  if (tipo === 'derrumbe') return { title: '\u00a1Hay un derrumbamiento!', message: 'Lanza el dado para intentar escapar.' };
  return { title: `\u00a1${nombre}!`, message: 'Lanza el dado para intentar escapar.' };
}

function getEnemyMovementLimit(nombre: string): number {
  const normalized = getNormalizedName(nombre);
  if (normalized.includes('goblin')) return ENEMY_MOVEMENT.goblin;
  if (normalized.includes('zombie')) return ENEMY_MOVEMENT.zombie;
  return 4;
}

function getEnemigoImageKey(nombre: string): string {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
}

function EnemyImgNode({ nombre, x, y, radius }: { nombre: string; x: number; y: number; radius: number }) {
  const key = getEnemigoImageKey(nombre);
  const [pngImg, pngStatus] = useImage(`/images/enemigos/${key}Enemigo.png`);
  const [jpgImg, jpgStatus] = useImage(`/images/enemigos/${key}Enemigo.jpg`);
  const img = pngStatus === 'loaded' && pngImg ? pngImg : jpgStatus === 'loaded' && jpgImg ? jpgImg : null;
  if (!img) return null;
  return (
    <KonvaImage
      image={img}
      x={x - radius}
      y={y - radius}
      width={radius * 2}
      height={radius * 2}
      cornerRadius={radius}
      listening={false}
    />
  );
}

function BlockedCellImgNode({ url, x, y, size }: { url: string; x: number; y: number; size: number }) {
  const [img] = useImage(url);
  if (!img) return null;
  return <KonvaImage image={img} x={x} y={y} width={size} height={size} listening={false} />;
}

function TrapImgNode({ url, x, y, radius }: { url: string; x: number; y: number; radius: number }) {
  const [img] = useImage(url);
  if (!img) return null;
  return (
    <KonvaImage
      image={img}
      x={x - radius}
      y={y - radius}
      width={radius * 2}
      height={radius * 2}
      cornerRadius={radius}
      listening={false}
    />
  );
}

interface BoardTokenNodeProps {
  token: BoardToken;
  x: number;
  y: number;
  radius: number;
  selected: boolean;
  disabled: boolean;
  draggable: boolean;
  isCurrentTurn?: boolean;
  onSelect: () => void;
  onPointerDown: (event: KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

function BoardTokenNode({ token, x, y, radius, selected, disabled, draggable, isCurrentTurn = false, onSelect, onPointerDown }: BoardTokenNodeProps) {
  // Solo cargar imagen si la URL es válida y no vacía
  const validAvatarUrl = token.avatarUrl && token.avatarUrl.trim() && /^(https?:\/\/|\/|data:)/.test(token.avatarUrl) ? token.avatarUrl : null;
  // Solo llamar a useImage si tenemos una URL válida
  const [avatarImage] = useImage(validAvatarUrl || '');
  const [avatarImageReady, setAvatarImageReady] = useState(false);
  
  // Detectar cuando la imagen del avatar está lista
  useEffect(() => {
    if (validAvatarUrl && avatarImage && avatarImage.width > 0 && avatarImage.height > 0) {
      setAvatarImageReady(true);
    } else {
      setAvatarImageReady(false);
    }
  }, [avatarImage, validAvatarUrl]);
  
  const avatarZoom = 1.75;
  const avatarVisibleDiameter = radius * 2 - 4;
  const avatarRenderSize = avatarVisibleDiameter * avatarZoom;
  const activeBorderColor = 'white';

  return (
    <Group
      x={x}
      y={y}
      onClick={() => { if (!disabled) onSelect(); }}
      onTap={() => { if (!disabled) onSelect(); }}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      opacity={disabled ? 0.72 : 1}
      draggable={false}
      listening
      // Solo mostrar mano/puntero cuando el token es realmente interactivo para mover.
      cursor={draggable ? 'grab' : 'default'}
    >
      <Circle
        radius={radius}
        fill="rgba(255,255,255,0.05)"
        stroke={token.color}
        strokeWidth={2}
        shadowColor="rgba(0, 0, 0, 0.45)"
        shadowBlur={8}
      />
      {selected && !isCurrentTurn && (
        <Circle
          radius={radius + 3}
          fillEnabled={false}
          stroke="white"
          strokeWidth={2}
          listening={false}
        />
      )}
      {isCurrentTurn && (
        <Circle
          radius={radius + 7}
          fillEnabled={false}
          stroke={activeBorderColor}
          strokeWidth={3}
          shadowColor={activeBorderColor}
          shadowBlur={10}
          listening={false}
        />
      )}
      {avatarImageReady && avatarImage && (
        <Group
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.arc(0, 0, radius - 1.5, 0, Math.PI * 2, true);
            ctx.closePath();
          }}
          listening={false}
        >
          <KonvaImage
            image={avatarImage}
            x={-avatarRenderSize / 2}
            y={-avatarRenderSize / 2}
            width={avatarRenderSize}
            height={avatarRenderSize}
          />
        </Group>
      )}
      {!avatarImageReady && (
        <Text
          x={-radius}
          y={-radius + 1}
          width={radius * 2}
          height={radius * 2}
          text={token.initials}
          align="center"
          verticalAlign="middle"
          fontStyle="bold"
          fontSize={Math.max(10, radius * 0.9)}
          fill="#ffffff"
          listening={false}
        />
      )}
    </Group>
  );
}

interface StoryModeDoorModalProps {
  door: Door;
  onOpen: () => void;
  onOpenDouble: () => void;
  onCancel: () => void;
}

function StoryModeDoorModal({ door, onOpen, onOpenDouble, onCancel }: StoryModeDoorModalProps) {
  if (!door) return null;

  return (
    <div className={`gb-door-modal ${door.type === 'secret' ? 'secret' : ''} ${door.type === 'double' ? 'double' : ''}`} role="dialog" aria-modal="true" aria-label="Puerta encontrada">
      {door.type === 'normal' && (
        <>
          <h3 className="gb-door-modal-title">🚪 Puerta encontrada</h3>
          <p className="gb-door-modal-text">¿Quieres abrir esta sala?</p>
          <div className="gb-door-modal-actions">
            <button type="button" className="gb-door-modal-btn primary" onClick={onOpen}>Abrir sala</button>
            <button type="button" className="gb-door-modal-btn" onClick={onCancel}>Cancelar</button>
          </div>
        </>
      )}

      {door.type === 'secret' && (
        <>
          <h3 className="gb-door-modal-title">🔍 Buscar puerta secreta</h3>
          <p className="gb-door-modal-text">El personaje busca una entrada oculta...</p>
          <div className="gb-door-modal-actions">
            <button type="button" className="gb-door-modal-btn primary" onClick={onOpen}>Buscar puerta secreta</button>
            <button type="button" className="gb-door-modal-btn" onClick={onCancel}>Cancelar</button>
          </div>
        </>
      )}

      {door.type === 'double' && (
        <>
          <h3 className="gb-door-modal-title">🚪🚪 Puerta doble</h3>
          <p className="gb-door-modal-text">Esta puerta requiere dos personajes para abrirse. Al abrirla se habilita también la puerta contigua.</p>
          <div className="gb-door-modal-actions">
            <button type="button" className="gb-door-modal-btn primary" onClick={onOpenDouble}>Abrir puerta doble</button>
            <button type="button" className="gb-door-modal-btn" onClick={onCancel}>Cancelar</button>
          </div>
        </>
      )}
    </div>
  );
}

export function GameBoard({ mapConfig, tokens, onTokenMove, jugadores = [], turnoActual = null, sendFinTurno, jugadorActual = null, miPersonajeId = '', movimientoRoll = null, onMovimientoUsed, enemyTokens = [], trapTokens = [], esMaster = false, revealedRooms = [], onRoomRevealed, onEnemyMove, onMasterFinTurno, nombreMaster, onActiveEnemiesChange, onOpenEnemyDetails, onTrapTriggered, blockedCells: blockedCellsProp, revealedTrapIds, onCellBlocked, onPlayerTokenClick }: GameBoardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; originX: number; originY: number } | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef<{ tokenId: string; originCell: CellPosition; currentCell: CellPosition } | null>(null);
  const draggingEnemyRef = useRef<{ instanciaId: string; originCell: CellPosition; currentCell: CellPosition } | null>(null);

  const [stageSize, setStageSize] = useState<Size>({ width: 1, height: 1 });
  const [mapPan, setMapPan] = useState<PanPoint>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isPointerOnMap, setIsPointerOnMap] = useState(false);
  const [openTurnModalTokenId, setOpenTurnModalTokenId] = useState<string | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(tokens[0]?.id ?? null);
  const [tokenCells, setTokenCells] = useState<Record<string, CellPosition>>(() => {
    const initial: Record<string, CellPosition> = {};
    for (const token of tokens) initial[token.id] = { col: token.col, row: token.row };
    return initial;
  });
  const [dragOriginCell, setDragOriginCell] = useState<CellPosition | null>(null);
  const [dragCurrentCell, setDragCurrentCell] = useState<CellPosition | null>(null);
  const [enemyDragOriginCell, setEnemyDragOriginCell] = useState<CellPosition | null>(null);
  const [enemyDragCurrentCell, setEnemyDragCurrentCell] = useState<CellPosition | null>(null);
  const [animatingTokenId, setAnimatingTokenId] = useState<string | null>(null);
  const [animPath, setAnimPath] = useState<CellPosition[]>([]);
  const [animStep, setAnimStep] = useState(0);
  const [rolledMovement, setRolledMovement] = useState<number | null>(null);
  const [stepsUsed, setStepsUsed] = useState(0);
  const [enemyConflict, setEnemyConflict] = useState<ConflictState | null>(null);
  const [mapImageReady, setMapImageReady] = useState(false);
  const isHistoria1 = mapConfig.imageUrl.includes('tableroModHistoria1');
  const activeDoors = useMemo(() => isHistoria1 ? DOORS : [], [isHistoria1]);
  const [rooms, setRooms] = useState<Room[]>(isHistoria1 ? ROOMS : []);
  const [pendingDoor, setPendingDoor] = useState<Door | null>(null);
  const [enemyTokenCells, setEnemyTokenCells] = useState<Record<string, CellPosition>>({});
  const [activeEnemyIds, setActiveEnemyIds] = useState<Set<string>>(new Set());
  const prevEnemyKeyRef = useRef<string>('');
  const [showMasterTurnModal, setShowMasterTurnModal] = useState(false);
  const [trapState, setTrapState] = useState<
    | { phase: 'warning';          instanciaId: string; nombre: string; imageUrl: string; prevCol: number; prevRow: number }
    | { phase: 'rolling';          instanciaId: string; nombre: string; imageUrl: string; prevCol: number; prevRow: number }
    | { phase: 'bomba-exploto';    imageUrl: string }
    | { phase: 'derrumbe-exploto'; imageUrl: string; trapCol: number; trapRow: number; prevCol: number; prevRow: number }
    | null
  >(null);
  const blockedCells = blockedCellsProp ?? new Map<string, string>();

  const activeTurn = turnoActual?.fase ?? 'personajes';
  const currentTurnTokenId = turnoActual?.turnoActualPersonajeId?.toString() ?? null;
  const enemyMovementById = useMemo(() => {
    const next: Record<string, number> = {};
    for (const enemy of enemyTokens) {
      next[enemy.instanciaId] = enemy.movement ?? getEnemyMovementLimit(enemy.nombre);
    }
    return next;
  }, [enemyTokens]);

  const [mapImage] = useImage(mapConfig.imageUrl);
  const dismissedConflictKeyRef = useRef('');
  const currentConflictKeyRef = useRef('');
  const lastMoveInitiatorRef = useRef<{ type: 'personaje' | 'enemigo'; id: string } | null>(null);
  const isCellBlocked = useCallback((col: number, row: number): boolean => {
    if (blockedCells.has(`${col},${row}`)) return true; // derrumbamiento
    if (ALWAYS_WALKABLE.has(`${col},${row}`)) return false;

    for (const room of rooms) {
      const inside =
        col >= room.colStart && col <= room.colEnd &&
        row >= room.rowStart && row <= room.rowEnd;
      if (!inside) continue;

      const isDoor = activeDoors.some(d =>
        (d.trigger.col === col && d.trigger.row === row) ||
        (d.target.col === col && d.target.row === row)
      );
      if (isDoor) return false;

      if (!room.revealed) return true;

      return false;
    }

    return false;
  }, [rooms, blockedCells]);

  const isMovementBlocked = useCallback((
    fromCol: number,
    fromRow: number,
    toCol: number,
    toRow: number
  ): boolean => {
    if (isCellBlocked(toCol, toRow)) return true;

    for (const room of rooms) {
      const fromInside =
        fromCol >= room.colStart && fromCol <= room.colEnd &&
        fromRow >= room.rowStart && fromRow <= room.rowEnd;
      const toInside =
        toCol >= room.colStart && toCol <= room.colEnd &&
        toRow >= room.rowStart && toRow <= room.rowEnd;

      // No puede moverse dentro de sala no revelada
      if (fromInside && toInside && !room.revealed) return true;

      // Intenta salir de sala revelada (dentro → fuera)
      if (fromInside && !toInside && room.revealed) {
        const isDoorExit = activeDoors.some(d =>
          d.roomId === room.id && (
            (d.trigger.col === toCol && d.trigger.row === toRow) ||
            (d.target.col === toCol && d.target.row === toRow) ||
            (d.trigger.col === fromCol && d.trigger.row === fromRow) ||
            (d.target.col === fromCol && d.target.row === fromRow)
          )
        );
        const isCrossingDoor = activeDoors.some(d =>
          (d.trigger.col === fromCol && d.trigger.row === fromRow &&
           d.target.col === toCol   && d.target.row === toRow) ||
          (d.target.col  === fromCol && d.target.row  === fromRow &&
           d.trigger.col === toCol   && d.trigger.row === toRow)
        );
        if (!isDoorExit && !isCrossingDoor) return true;
      }

      // Intenta entrar a sala revelada (fuera → dentro)
      if (!fromInside && toInside && room.revealed) {
        const isDoorEntry = activeDoors.some(d =>
          d.roomId === room.id && (
            (d.trigger.col === fromCol && d.trigger.row === fromRow) ||
            (d.target.col === fromCol && d.target.row === fromRow) ||
            (d.trigger.col === toCol && d.trigger.row === toRow) ||
            (d.target.col === toCol && d.target.row === toRow)
          )
        );
        const isCrossingDoor = activeDoors.some(d =>
          (d.trigger.col === fromCol && d.trigger.row === fromRow &&
           d.target.col === toCol   && d.target.row === toRow) ||
          (d.target.col  === fromCol && d.target.row  === fromRow &&
           d.trigger.col === toCol   && d.trigger.row === toRow)
        );
        if (!isDoorEntry && !isCrossingDoor) return true;
      }

      // Intenta entrar a sala no revelada (fuera → dentro)
      if (!fromInside && toInside && !room.revealed) {
        const isTriggerEntry = activeDoors.some(d =>
          d.roomId === room.id &&
          d.trigger.col === toCol && d.trigger.row === toRow
        );
        if (!isTriggerEntry) return true;
      }

      // Intenta salir de sala no revelada (dentro → fuera)
      if (fromInside && !toInside && !room.revealed) {
        const isTriggerExit = activeDoors.some(d =>
          d.roomId === room.id &&
          d.trigger.col === fromCol && d.trigger.row === fromRow
        );
        const isCrossingDoor = activeDoors.some(d =>
          (d.trigger.col === fromCol && d.trigger.row === fromRow &&
           d.target.col === toCol   && d.target.row === toRow) ||
          (d.target.col  === fromCol && d.target.row  === fromRow &&
           d.trigger.col === toCol   && d.trigger.row === toRow)
        );
        if (!isTriggerExit && !isCrossingDoor) return true;
      }
    }

    return false;
  }, [isCellBlocked, rooms]);

  const { pixelToCell, cellToPixel, getReachableCells } = useBoardGrid(mapConfig, isMovementBlocked);

  useEffect(() => {
    if (mapImage && mapImage.width > 0 && mapImage.height > 0) {
      setMapImageReady(true);
    } else {
      setMapImageReady(false);
    }
  }, [mapImage]);

  const openRoomDouble = useCallback((door: Door) => {
    setRooms(prev => prev.map((room) => (room.id === door.roomId ? { ...room, revealed: true } : room)));
    setPendingDoor(null);
    onRoomRevealed?.(door.roomId);
  }, [onRoomRevealed]);

  // Sync rooms revealed by other players (via WS)
  useEffect(() => {
    if (revealedRooms.length === 0) return;
    setRooms(prev => {
      const hasChanges = prev.some(r => !r.revealed && revealedRooms.includes(r.id));
      if (!hasChanges) return prev;
      return prev.map(room => revealedRooms.includes(room.id) ? { ...room, revealed: true } : room);
    });
  }, [revealedRooms]);

  // Sync enemy token cell positions from prop (initial + WS updates)
  useEffect(() => {
    setEnemyTokenCells(prev => {
      const next = { ...prev };
      for (const e of enemyTokens) {
        if (draggingEnemyRef.current?.instanciaId !== e.instanciaId) {
          next[e.instanciaId] = { col: e.col, row: e.row };
        }
      }
      return next;
    });
  }, [enemyTokens]);

  // Reset activation state when a new enemy configuration is loaded (new game).
  useEffect(() => {
    const key = enemyTokens.map(e => e.instanciaId).sort().join(',');
    if (key !== prevEnemyKeyRef.current) {
      prevEnemyKeyRef.current = key;
      setActiveEnemyIds(new Set());
    }
  }, [enemyTokens]);

  useEffect(() => {
    onActiveEnemiesChange?.(activeEnemyIds);
  }, [activeEnemyIds, onActiveEnemiesChange]);

  // Activate enemies inside a newly-revealed room.
  // Trigger cells are excluded: even if inside a room's bounding box, they use range activation.
  useEffect(() => {
    setActiveEnemyIds(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const room of rooms) {
        if (!room.revealed) continue;
        for (const enemy of enemyTokens) {
          if (next.has(enemy.instanciaId)) continue;
          const eCell = enemyTokenCells[enemy.instanciaId] ?? { col: enemy.col, row: enemy.row };
          const isAtTrigger = activeDoors.some(d => d.trigger.col === eCell.col && d.trigger.row === eCell.row);
          if (!isAtTrigger &&
              eCell.col >= room.colStart && eCell.col <= room.colEnd &&
              eCell.row >= room.rowStart && eCell.row <= room.rowEnd) {
            next.add(enemy.instanciaId);
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [rooms, enemyTokens, enemyTokenCells, activeDoors]);

  // Activate corridor/trigger enemies via proximity (≤4 cells, same row or column).
  // Enemies inside a closed room are protected — room-based activation handles those.
  // Trigger cells are never treated as part of a room even if inside its bounding box.
  useEffect(() => {
    if (enemyTokens.length === 0) return;
    setActiveEnemyIds(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const enemy of enemyTokens) {
        if (next.has(enemy.instanciaId)) continue;
        const eCell = enemyTokenCells[enemy.instanciaId] ?? { col: enemy.col, row: enemy.row };
        const isAtTrigger = activeDoors.some(d => d.trigger.col === eCell.col && d.trigger.row === eCell.row);
        if (!isAtTrigger) {
          // Guard: skip enemies inside any closed room — room-based activation handles those
          const inAnyRoom = rooms.some(room =>
            eCell.col >= room.colStart && eCell.col <= room.colEnd &&
            eCell.row >= room.rowStart && eCell.row <= room.rowEnd
          );
          if (inAnyRoom) continue;
        }
        // Activate if any player is within 4 cells in the same row or column
        for (const pCell of Object.values(tokenCells)) {
          const sameRow = pCell.row === eCell.row;
          const sameCol = pCell.col === eCell.col;
          if (!sameRow && !sameCol) continue;
          const dist = sameRow
            ? Math.abs(pCell.col - eCell.col)
            : Math.abs(pCell.row - eCell.row);
          if (dist <= 4) {
            next.add(enemy.instanciaId);
            changed = true;
            break;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [tokenCells, enemyTokenCells, enemyTokens, rooms, activeDoors]);

  useEffect(() => {
    setTokenCells(prev => {
      const next: Record<string, CellPosition> = { ...prev };
      let changed = false;
      for (const token of tokens) {
        if (token.id === miPersonajeId) continue;
        const cur = prev[token.id];
        if (!cur) {
          next[token.id] = { col: token.col, row: token.row };
          changed = true;
        } else if (animatingTokenId !== token.id && (cur.col !== token.col || cur.row !== token.row)) {
          next[token.id] = { col: token.col, row: token.row };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tokens, animatingTokenId, miPersonajeId]);

  useEffect(() => {
    return () => { if (animTimerRef.current) clearTimeout(animTimerRef.current); };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const updateSize = () => setStageSize({ width: Math.max(1, wrapper.clientWidth), height: Math.max(1, wrapper.clientHeight) });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const next: Record<string, CellPosition> = {};
    for (const token of tokens) next[token.id] = { col: token.col, row: token.row };
    setTokenCells(next);
  }, [tokens]);

  const tokensActivos = useMemo(() => {
    return tokens.filter((token) => {
      if (jugadores.length === 0) return true;
      return jugadores.some((j) =>
        j && (
          j.id?.toString() === token.id ||
          j.usuario_id?.toString() === token.id ||
          (j.nombre && token.initials === j.nombre.slice(0, 2).toUpperCase())
        ) &&
        j.conectado !== false
      );
    });
  }, [tokens, jugadores]);

  // Players only see enemies in revealed rooms; master always sees all
  const visibleEnemyTokens = useMemo(() => {
    if (esMaster) return enemyTokens;
    return enemyTokens.filter(e => activeEnemyIds.has(e.instanciaId));
  }, [esMaster, enemyTokens, activeEnemyIds]);

  // Master manages the same set of enemies that are actively visible.
  // Corridor/trigger enemies become manageable only after activation (player proximity or room reveal).
  const masterCanManageIds = activeEnemyIds;

  const endedTurnIds = useMemo(() => {
    const ended = new Set<string>();
    const orderedTurnTokens = tokensActivos.length > 0 ? tokensActivos : tokens;

    if (activeTurn === 'master') {
      orderedTurnTokens.forEach((t) => ended.add(t.id));
      return ended;
    }

    if (activeTurn !== 'personajes' || !currentTurnTokenId) return ended;

    const currentIndex = orderedTurnTokens.findIndex((t) => t.id === currentTurnTokenId);
    if (currentIndex <= 0) return ended;

    for (let i = 0; i < currentIndex; i++) {
      ended.add(orderedTurnTokens[i].id);
    }

    return ended;
  }, [tokens, tokensActivos, activeTurn, currentTurnTokenId]);

  useEffect(() => {
    if (tokens.length > 0 && !tokens.some((t) => t.id === selectedTokenId)) {
      setSelectedTokenId(tokens[0].id);
    }
    // Si hay un token actualmente en turno, seleccionarlo automáticamente
    if (currentTurnTokenId) {
      setSelectedTokenId(currentTurnTokenId);
    }
  }, [tokens, selectedTokenId, currentTurnTokenId]);

  useEffect(() => {
    if (activeTurn !== 'personajes') { setRolledMovement(null); setStepsUsed(0); return; }
    if (currentTurnTokenId === jugadorActual?.id?.toString() || currentTurnTokenId === jugadorActual?.personajeId?.toString()) {
      setRolledMovement(movimientoRoll ?? null);
      setStepsUsed(0);
    } else {
      setRolledMovement(null);
      setStepsUsed(0);
    }
  }, [currentTurnTokenId, activeTurn, jugadorActual, movimientoRoll]);

  const remainingMovement = rolledMovement !== null ? Math.max(0, rolledMovement - stepsUsed) : null;

  const fitScale = Math.min(stageSize.width / mapConfig.naturalWidth, stageSize.height / mapConfig.naturalHeight);
  const renderScale = fitScale * 0.85;
  const mapRenderWidth = mapConfig.naturalWidth * renderScale;
  const mapRenderHeight = mapConfig.naturalHeight * renderScale;
  const mapOriginX = (stageSize.width - mapRenderWidth) / 2 + mapPan.x;
  const mapOriginY = (stageSize.height - mapRenderHeight) / 2 + mapPan.y;
  const overlayShiftX = -4;
  const cellSide = mapConfig.cellSize * renderScale;
  const tokenRadius = Math.max(9, mapConfig.cellSize * renderScale * 0.32);

  const allTurnsEnded = activeTurn === 'master';
  const isCurrentTurnTokenMine = Boolean(
    currentTurnTokenId && (currentTurnTokenId === miPersonajeId || currentTurnTokenId === jugadorActual?.id?.toString())
  );

  const buildPath = (from: CellPosition, to: CellPosition): CellPosition[] => {
    const path: CellPosition[] = [from];
    if (from.col === to.col) {
      const dir = to.row > from.row ? 1 : -1;
      for (let r = from.row + dir; r !== to.row + dir; r += dir) path.push({ col: from.col, row: r });
    } else {
      const dir = to.col > from.col ? 1 : -1;
      for (let c = from.col + dir; c !== to.col + dir; c += dir) path.push({ col: c, row: from.row });
    }
    return path;
  };

  const constrainToAxis = (origin: CellPosition, hover: CellPosition): CellPosition => {
    const dCol = Math.abs(hover.col - origin.col);
    const dRow = Math.abs(hover.row - origin.row);
    return dCol >= dRow ? { col: hover.col, row: origin.row } : { col: origin.col, row: hover.row };
  };

  const clampToReachable = (origin: CellPosition, target: CellPosition, reachableSet: Set<string>, occupiedKeys: Set<string>): CellPosition => {
    const path = buildPath(origin, target);
    let last = origin;
    let previous = origin;
    for (const cell of path.slice(1)) {
      const key = `${cell.col},${cell.row}`;
      if (!reachableSet.has(key)) break;
      if (isMovementBlocked(previous.col, previous.row, cell.col, cell.row)) break;
      if (!occupiedKeys.has(key)) last = cell;
      previous = cell;
    }
    return last;
  };

  const getOccupiedKeys = useCallback((excludeTokenId?: string, excludeEnemyId?: string): Set<string> => {
    const occupied = new Set<string>();
    for (const token of tokens) {
      if (token.id === excludeTokenId) continue;
      const cell = tokenCells[token.id];
      if (cell) occupied.add(`${cell.col},${cell.row}`);
    }
    for (const enemy of enemyTokens) {
      if (enemy.instanciaId === excludeEnemyId) continue;
      const cell = enemyTokenCells[enemy.instanciaId] ?? { col: enemy.col, row: enemy.row };
      occupied.add(`${cell.col},${cell.row}`);
    }
    return occupied;
  }, [enemyTokenCells, enemyTokens, tokenCells, tokens]);

  const isPointerInsideMap = (x: number, y: number): boolean => (
    x >= mapOriginX &&
    x <= mapOriginX + mapRenderWidth &&
    y >= mapOriginY &&
    y <= mapOriginY + mapRenderHeight
  );

  type OverlayEntry = { cell: CellPosition; step: number };
  const previewMode: MovePreviewKind | null = enemyDragCurrentCell && enemyDragOriginCell ? 'enemy' : (dragCurrentCell && dragOriginCell ? 'player' : null);
  const previewCells: OverlayEntry[] = [];
  const previewFill = previewMode === 'enemy' ? 'rgba(226, 40, 40, 0.42)' : 'rgba(255, 204, 0, 0.45)';
  const previewStroke = previewMode === 'enemy' ? 'rgba(255, 120, 120, 0.92)' : 'rgba(255, 220, 120, 0.9)';

  if (previewMode === 'enemy' && enemyDragOriginCell && enemyDragCurrentCell) {
    const path = buildPath(enemyDragOriginCell, enemyDragCurrentCell);
    previewCells.push(...path.slice(1).map((cell, i) => ({ cell, step: i + 1 })));
  } else if (previewMode === 'player' && dragOriginCell && dragCurrentCell) {
    const path = buildPath(dragOriginCell, dragCurrentCell);
    previewCells.push(...path.slice(1).map((cell, i) => ({ cell, step: stepsUsed + i + 1 })));
  } else if (animatingTokenId && animPath.length > 0 && animStep > 0) {
    previewCells.push(...animPath.slice(1, animStep + 1).map((cell, i) => ({ cell, step: stepsUsed + i + 1 })));
  }

  const startAnimation = (tokenId: string, path: CellPosition[]) => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setAnimatingTokenId(tokenId);
    setAnimPath(path);
    setAnimStep(0);
    setTokenCells(prev => ({ ...prev, [tokenId]: path[0] }));

    let step = 0;
    const advance = () => {
      step++;
      if (step >= path.length) {
        const to = path[path.length - 1];
        setAnimatingTokenId(null);
        setAnimPath([]);
        setAnimStep(0);
        const stepsJustUsed = path.length - 1;
        setStepsUsed(prev => prev + stepsJustUsed);
        onMovimientoUsed?.(stepsJustUsed);
        const door = activeDoors.find(d =>
          d.trigger.col === to.col && d.trigger.row === to.row
        );
        if (door) {
          const room = rooms.find(r => r.id === door.roomId);
          if (room && !room.revealed) {
            onTokenMove?.(tokenId, to.col, to.row);
            setPendingDoor(door);
            return;
          }
        }
        onTokenMove?.(tokenId, to.col, to.row);
        // Detección de trampa: solo para el token del jugador actual (no master)
        if (!esMaster && miPersonajeId && tokenId === miPersonajeId) {
          const trap = trapTokens.find(t => t.col === to.col && t.row === to.row);
          if (trap) {
            const prevCell = path.length >= 2 ? path[path.length - 2] : to;
            setTrapState({ phase: 'warning', instanciaId: trap.instanciaId, nombre: trap.nombre, imageUrl: trap.imageUrl, prevCol: prevCell.col, prevRow: prevCell.row });
          }
        }
        return;
      }
      setTokenCells(prev => ({ ...prev, [tokenId]: path[step] }));
      setAnimStep(step);
      animTimerRef.current = setTimeout(advance, 220);
    };
    advance();
  };

  const handleStagePointerDown = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (draggingRef.current) return;
    const className = event.target.getClassName();
    if (className !== 'Stage' && className !== 'Image') return;
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    if (!isPointerInsideMap(pointer.x, pointer.y)) return;
    panStartRef.current = { pointerX: pointer.x, pointerY: pointer.y, originX: mapPan.x, originY: mapPan.y };
    setIsPanning(true);
  };

  const handleStagePointerMove = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    setIsPointerOnMap(isPointerInsideMap(pointer.x, pointer.y));

    if (draggingEnemyRef.current) {
      const { instanciaId, originCell } = draggingEnemyRef.current;
      const enemy = enemyTokens.find(e => e.instanciaId === instanciaId);
      if (!enemy) return;
      const localX = pointer.x - mapOriginX;
      const localY = pointer.y - mapOriginY;
      const cell = pixelToCell(localX, localY, renderScale);
      if (cell) {
        const constrained = constrainToAxis(originCell, cell);
        const limit = enemyMovementById[instanciaId] ?? getEnemyMovementLimit(enemy.nombre);
        const localReachable = getReachableCells(originCell.col, originCell.row, limit);
        const occupiedKeys = getOccupiedKeys(undefined, instanciaId);
        const clamped = clampToReachable(originCell, constrained, localReachable, occupiedKeys);
        draggingEnemyRef.current.currentCell = clamped;
        setEnemyDragCurrentCell(clamped);
        setEnemyTokenCells(prev => ({ ...prev, [instanciaId]: clamped }));
      }
      return;
    }

    if (draggingRef.current) {
      const { originCell, tokenId } = draggingRef.current;
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return;
      const localX = pointer.x - mapOriginX;
      const localY = pointer.y - mapOriginY;
      const raw = pixelToCell(localX, localY, renderScale);
      if (!raw) return;
      const constrained = constrainToAxis(originCell, raw);
      const localReachable = getReachableCells(
        originCell.col,
        originCell.row,
        remainingMovement ?? 0
      );
      const occupiedKeys = new Set<string>(
        tokens
          .filter(t => t.id !== tokenId)
          .flatMap(t => {
            const cell = tokenCells[t.id];
            return cell ? [`${cell.col},${cell.row}`] : [];
          })
      );
      const clamped = clampToReachable(originCell, constrained, localReachable, occupiedKeys);
      draggingRef.current.currentCell = clamped;
      const isSameAsOrigin = clamped.col === originCell.col && clamped.row === originCell.row;
      setDragCurrentCell(isSameAsOrigin ? null : clamped);
      return;
    }

    if (!isPanning || !panStartRef.current) return;
    const deltaX = pointer.x - panStartRef.current.pointerX;
    const deltaY = pointer.y - panStartRef.current.pointerY;
    setMapPan({ x: panStartRef.current.originX + deltaX, y: panStartRef.current.originY + deltaY });
  };

  const handleStagePointerUp = () => {
    if (draggingEnemyRef.current) {
      const { instanciaId, originCell, currentCell } = draggingEnemyRef.current;
      draggingEnemyRef.current = null;
      setEnemyDragCurrentCell(null);
      setEnemyDragOriginCell(null);
      if (!(currentCell.col === originCell.col && currentCell.row === originCell.row)) {
        // Mark that the last movement was initiated by an enemy (likely by the master)
        lastMoveInitiatorRef.current = { type: 'enemigo', id: instanciaId };
        onEnemyMove?.(instanciaId, currentCell.col, currentCell.row);
        return;
      }
      return;
    }

    if (draggingRef.current) {
      const { tokenId, originCell, currentCell } = draggingRef.current;
      draggingRef.current = null;
      setDragCurrentCell(null);
      setDragOriginCell(null);
      const moved = !(currentCell.col === originCell.col && currentCell.row === originCell.row);
      if (moved) {
        // Mark that the last movement was initiated by a personaje (player)
        lastMoveInitiatorRef.current = { type: 'personaje', id: tokenId };
        startAnimation(tokenId, buildPath(originCell, currentCell));
      }
      return;
    }
    panStartRef.current = null;
    setIsPanning(false);
  };

  const resetCharacterTurns = () => {
    setOpenTurnModalTokenId(null);
    if (tokens.length > 0) setSelectedTokenId(tokens[0].id);
  };

  const handleTurnTab = (side: TurnSide) => {
    if (side === 'personajes') {
      if (activeTurn === 'personajes' && !allTurnsEnded) return;
      resetCharacterTurns();
      return;
    }
    if (!allTurnsEnded) return;
    if (esMaster) {
      setShowMasterTurnModal(prev => !prev);
      return;
    }
    setOpenTurnModalTokenId(null);
  };

  useEffect(() => {
    // Fix 1: no detectar conflicto mientras hay movimiento en curso (animación o arrastre de enemigo)
    // Evita que el modal salga al pasar de largo junto a un enemigo
    if (animatingTokenId !== null || enemyDragCurrentCell !== null) {
      setEnemyConflict(null);
      return;
    }

    const tokenPositions = tokens
      .map((token) => ({ token, cell: tokenCells[token.id] }))
      .filter((entry): entry is { token: BoardToken; cell: CellPosition } => Boolean(entry.cell));

    const tokensToCheck = currentTurnTokenId
      ? tokenPositions.filter(({ token }) => token.id.toString() === currentTurnTokenId.toString())
      : tokenPositions;

    // Fix 2: solo comprobar enemigos activados; los que están en salas cerradas o sin alcanzar no generan conflicto
    const enemyPositions = enemyTokens
      .filter(enemy => activeEnemyIds.has(enemy.instanciaId))
      .map((enemy) => ({
        enemy,
        cell: enemyTokenCells[enemy.instanciaId] ?? { col: enemy.col, row: enemy.row },
      }));

    let detected: ConflictState | null = null;

    for (const { token, cell: tokenCell } of tokensToCheck) {
      const enemy = enemyPositions.find(({ cell }) => {
        const sameRow = cell.row === tokenCell.row && Math.abs(cell.col - tokenCell.col) === 1;
        const sameCol = cell.col === tokenCell.col && Math.abs(cell.row - tokenCell.row) === 1;
        return sameRow || sameCol;
      });

      if (!enemy) continue;

      const key = `${currentTurnTokenId ?? 'no-turn'}:${token.id}:${enemy.enemy.instanciaId}:${tokenCell.col},${tokenCell.row}:${enemy.cell.col},${enemy.cell.row}`;
      currentConflictKeyRef.current = key;
      if (dismissedConflictKeyRef.current === key) {
        setEnemyConflict(null);
        return;
      }

      let attackerSide: 'personaje' | 'enemigo' = activeTurn === 'master' ? 'enemigo' : 'personaje';
      const last = lastMoveInitiatorRef.current;
      if (last) {
        if (last.type === 'enemigo' && last.id === enemy.enemy.instanciaId) attackerSide = 'enemigo';
        else if (last.type === 'personaje' && last.id === token.id) attackerSide = 'personaje';
      }

      detected = {
        tokenId: token.id,
        tokenName: token.initials,
        enemyId: enemy.enemy.instanciaId,
        enemyName: enemy.enemy.nombre,
        attacker: attackerSide,
        defender: attackerSide === 'personaje' ? 'enemigo' : 'personaje',
      };
      break;
    }

    if (!detected) {
      currentConflictKeyRef.current = '';
      dismissedConflictKeyRef.current = '';
    }

    setEnemyConflict(detected);
  }, [activeTurn, currentTurnTokenId, enemyTokenCells, enemyTokens, tokenCells, tokens, animatingTokenId, enemyDragCurrentCell, activeEnemyIds]);

  useEffect(() => {
    if (esMaster) return;
    if (!currentTurnTokenId || !miPersonajeId) {
      setEnemyConflict(null);
      currentConflictKeyRef.current = '';
      dismissedConflictKeyRef.current = '';
      return;
    }

    if (currentTurnTokenId.toString() !== miPersonajeId.toString()) {
      setEnemyConflict(null);
      currentConflictKeyRef.current = '';
      dismissedConflictKeyRef.current = '';
    }
  }, [currentTurnTokenId, miPersonajeId, esMaster]);

  const handleAvatarClick = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    if (activeTurn === 'personajes' && tokenId === currentTurnTokenId && !isCurrentTurnTokenMine) {
      return;
    }
    setOpenTurnModalTokenId((prev) => (prev === tokenId ? null : tokenId));
  };

  const finalizeTurn = (tokenId: string) => {
    if (activeTurn !== 'personajes') return;
    if (currentTurnTokenId !== tokenId.toString()) return;
    setOpenTurnModalTokenId(null);
    sendFinTurno?.(tokenId);
  };

  const localConflictTokenId = miPersonajeId ? miPersonajeId.toString() : '';

  const canSeeConflict = Boolean(enemyConflict) && trapState === null && (
    esMaster || (
      localConflictTokenId !== '' &&
      localConflictTokenId === (enemyConflict?.tokenId ?? '').toString()
    )
  );

  return (
    <div ref={wrapperRef} className="gb-stage-wrap">
      <div className="gb-top-tab">
        <h3 className="gb-top-title">Ravenloft Castle</h3>

        <div className="gb-top-avatars" aria-label="Personajes en partida">
          {activeTurn === 'master'
            ? (
              <div className="gb-top-avatar-wrap">
                <button
                  type="button"
                  className="gb-top-avatar current"
                  style={{
                    borderColor: '#f1c40f',
                    boxShadow: '0 0 0 3px rgba(241,196,15,0.7), 0 0 10px rgba(241,196,15,0.3)',
                    cursor: esMaster ? 'pointer' : 'default',
                  }}
                  title={esMaster ? (nombreMaster ?? 'Master') : 'Master'}
                  onClick={() => { if (esMaster) setShowMasterTurnModal(prev => !prev); }}
                >
                  {esMaster ? (nombreMaster ?? 'M').trim().slice(0, 1).toUpperCase() : 'M'}
                </button>
                {showMasterTurnModal && esMaster && (
                  <div className="gb-turn-modal" role="dialog" aria-label="Finalizar turno del master">
                    <p className="gb-turn-modal-text">¿Finalizar el turno del master?</p>
                    <button
                      type="button"
                      className="gb-turn-finalize-btn"
                      onClick={() => { setShowMasterTurnModal(false); onMasterFinTurno?.(); }}
                    >
                      Finalizar turno
                    </button>
                  </div>
                )}
              </div>
            )
            : tokens.map((token) => {
              const isCurrent = token.id === currentTurnTokenId;
              const ended = endedTurnIds.has(token.id);
              const isFixedWaitingModal = activeTurn === 'personajes' && isCurrent && !isCurrentTurnTokenMine;
              const showModal = openTurnModalTokenId === token.id || isFixedWaitingModal;
              return (
                <div key={`top-${token.id}`} className="gb-top-avatar-wrap">
                  <button
                    type="button"
                    className={`gb-top-avatar ${selectedTokenId === token.id ? 'active' : ''} ${isCurrent && activeTurn === 'personajes' ? 'current' : ''} ${ended ? 'ended' : ''}`}
                    style={{
                      borderColor: token.color,
                      backgroundImage: token.avatarUrl ? `url(${token.avatarUrl})` : undefined,
                      boxShadow: isCurrent && activeTurn === 'personajes'
                        ? '0 0 0 3px rgba(255, 255, 255, 0.95), 0 0 10px rgba(255, 255, 255, 0.45)'
                        : (selectedTokenId === token.id ? `0 0 0 2px ${token.color}55` : undefined)
                    }}
                    title={token.initials}
                    onClick={() => handleAvatarClick(token.id)}
                  >
                    {!token.avatarUrl ? token.initials : null}
                  </button>
                  {showModal && (
                    <div className="gb-turn-modal" role="dialog" aria-label="Finalizar turno">
                      {activeTurn === 'personajes' && isCurrent && token.id === miPersonajeId && (
                        <>
                          <p className="gb-turn-modal-text">¿Quieres finalizar el turno de este personaje?</p>
                          <button type="button" className="gb-turn-finalize-btn" onClick={() => finalizeTurn(token.id)}>
                            Finalizar turno
                          </button>
                        </>
                      )}
                      {activeTurn === 'personajes' && isCurrent && token.id !== miPersonajeId && (
                        <div className="gb-turn-modal-waiting">
                          <p className="gb-turn-modal-text">Esperando a que finalice su turno...</p>
                          <div className="gb-turn-waiting-loader" aria-label="Esperando fin de turno" />
                        </div>
                      )}
                      {activeTurn === 'personajes' && !isCurrent && <p className="gb-turn-modal-text">Todavía no le toca. Espera su turno.</p>}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>

        {activeTurn === 'personajes' && remainingMovement !== null && (
          <div className="gb-movement-roll">
            <span className="gb-movement-dice">🎲🎲</span>
            <span className="gb-movement-valor">{remainingMovement}</span>
            <span className="gb-movement-label">casillas de movimiento</span>
          </div>
        )}

        <div className="gb-turn-tabs">
          <button
            type="button"
            className={`gb-turn-btn ${activeTurn === 'personajes' ? 'active' : ''} ${activeTurn === 'master' ? 'disabled' : ''}`}
            onClick={() => handleTurnTab('personajes')}
            disabled={activeTurn === 'master'}
          >
            Turno de personajes
          </button>
          <button
            type="button"
            className={`gb-turn-btn ${activeTurn === 'master' ? 'active master' : ''}`}
            onClick={() => handleTurnTab('master')}
            disabled={activeTurn !== 'master'}
          >
            Turno del master
          </button>
        </div>

        {activeTurn === 'master' && !esMaster && (
          <div className="gb-master-box">
            <p className="gb-master-text">El master está resolviendo sus jugadas</p>
            <div className="gb-master-loader" aria-label="Cargando jugadas del master">
              <span className="dot d1" /><span className="dot d2" /><span className="dot d3" /><span className="dot d4" />
              <span className="dot d5" /><span className="dot d6" /><span className="dot d7" /><span className="dot d8" />
            </div>
          </div>
        )}
      </div>

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        className={`gb-stage ${isPanning || dragOriginCell !== null ? 'grabbing' : ''} ${!isPanning && dragOriginCell === null && isPointerOnMap ? 'map-hover' : ''}`}
        onMouseDown={handleStagePointerDown}
        onTouchStart={handleStagePointerDown}
        onMouseMove={handleStagePointerMove}
        onTouchMove={handleStagePointerMove}
        onMouseUp={handleStagePointerUp}
        onMouseLeave={handleStagePointerUp}
        onTouchEnd={handleStagePointerUp}
      >
        {/* Layer 1: mapa */}
        <Layer listening={false}>
          <Group x={mapOriginX} y={mapOriginY} scaleX={renderScale} scaleY={renderScale}>
            {mapImageReady && mapImage && (
              <KonvaImage image={mapImage} x={0} y={0} width={mapConfig.naturalWidth} height={mapConfig.naturalHeight} />
            )}
          </Group>
        </Layer>

        {/* Layer: celdas bloqueadas por derrumbamiento */}
        {blockedCells.size > 0 && (
          <Layer listening={false}>
            {Array.from(blockedCells.entries()).map(([key, imgUrl]) => {
              const [colStr, rowStr] = key.split(',');
              const bCol = Number(colStr);
              const bRow = Number(rowStr);
              const bPx = cellToPixel(bCol, bRow);
              const bx = mapOriginX + bPx.x * renderScale - cellSide / 2;
              const by = mapOriginY + bPx.y * renderScale - cellSide / 2;
              return (
                <Group key={key}>
                  <Rect x={bx} y={by} width={cellSide} height={cellSide} fill="black" />
                  {imgUrl && <BlockedCellImgNode url={imgUrl} x={bx} y={by} size={cellSide} />}
                </Group>
              );
            })}
          </Layer>
        )}

        {/* Layer 2: tokens (sin drag nativo — posición controlada por React state) */}
        <Layer>
          {tokens.map((token) => {
            const tokenCell = tokenCells[token.id];
            if (!tokenCell) return null;
            const tokenPixel = cellToPixel(tokenCell.col, tokenCell.row);
            const tokenX = mapOriginX + tokenPixel.x * renderScale;
            const tokenY = mapOriginY + tokenPixel.y * renderScale;
            const ended = endedTurnIds.has(token.id);
            const canDrag = activeTurn === 'personajes' && token.id === currentTurnTokenId && !ended && animatingTokenId === null && remainingMovement !== null && remainingMovement > 0;

            return (
              <BoardTokenNode
                key={token.id}
                token={token}
                x={tokenX}
                y={tokenY}
                radius={tokenRadius}
                selected={selectedTokenId === token.id}
                disabled={ended || activeTurn === 'master'}
                draggable={canDrag}
                isCurrentTurn={token.id === currentTurnTokenId && activeTurn === 'personajes'}
                onSelect={() => { if (animatingTokenId === null) { setSelectedTokenId(token.id); onPlayerTokenClick?.(token); } }}
                onPointerDown={(event) => {
                  event.cancelBubble = true;
                  if (!canDrag) {
                    if (animatingTokenId === null) setSelectedTokenId(token.id);
                    return;
                  }
                  const origin = tokenCells[token.id];
                  if (!origin) return;
                  setSelectedTokenId(token.id);
                  setDragOriginCell(origin);
                  setDragCurrentCell(null);
                  draggingRef.current = { tokenId: token.id, originCell: origin, currentCell: origin };
                }}
              />
            );
          })}
        </Layer>

        {/* Layer 3: overlay de movimiento (encima de los tokens para que los números sean visibles) */}
        <Layer listening={false}>
          {previewCells.map(({ cell, step }) => {
            const cellX = mapOriginX + (mapConfig.offsetX + cell.col * mapConfig.cellSize) * renderScale;
            const cellY = mapOriginY + (mapConfig.offsetY + cell.row * mapConfig.cellSize) * renderScale;
            return (
              <Group key={`ov-${cell.col}-${cell.row}`}>
                <Rect
                  x={cellX + overlayShiftX}
                  y={cellY}
                  width={cellSide}
                  height={cellSide}
                  fill={previewFill}
                  stroke={previewStroke}
                  strokeWidth={1.5}
                />
                <Text
                  x={cellX + overlayShiftX}
                  y={cellY}
                  width={cellSide}
                  height={cellSide}
                  text={step.toString()}
                  align="center"
                  verticalAlign="middle"
                  fontStyle="bold"
                  fontSize={Math.max(12, cellSide * 0.42)}
                  fill="#ffffff"
                  shadowColor="rgba(0,0,0,0.85)"
                  shadowBlur={4}
                  shadowOffsetX={1}
                  shadowOffsetY={1}
                />
              </Group>
            );
          })}
        </Layer>

        {/* Layer 4: tokens de enemigos */}
        {visibleEnemyTokens.length > 0 && (
          <Layer listening={true}>
            {visibleEnemyTokens.map((enemy) => {
              const cell = enemyTokenCells[enemy.instanciaId] ?? { col: enemy.col, row: enemy.row };
              const px = cellToPixel(cell.col, cell.row);
              const ex = mapOriginX + px.x * renderScale;
              const ey = mapOriginY + px.y * renderScale;
              const initials = enemy.nombre.slice(0, 2).toUpperCase();
              const canManage = masterCanManageIds.has(enemy.instanciaId);
              const canDragEnemy = esMaster && activeTurn === 'master' && canManage;
              // Inactive enemies (closed room, not yet visible to players) appear dimmed for master
              const opacity = esMaster && !canManage ? 0.3 : 1;
              return (
                <Group
                  key={enemy.instanciaId}
                  opacity={opacity}
                  onClick={() => { if (onOpenEnemyDetails) onOpenEnemyDetails(enemy.instanciaId); }}
                  onTap={() => { if (onOpenEnemyDetails) onOpenEnemyDetails(enemy.instanciaId); }}
                  onMouseDown={(e) => {
                    if (!canDragEnemy) return;
                    e.cancelBubble = true;
                    const origin = enemyTokenCells[enemy.instanciaId] ?? { col: enemy.col, row: enemy.row };
                    setEnemyDragOriginCell(origin);
                    setEnemyDragCurrentCell(null);
                    draggingEnemyRef.current = { instanciaId: enemy.instanciaId, originCell: origin, currentCell: origin };
                  }}
                  onTouchStart={(e) => {
                    if (!canDragEnemy) return;
                    e.cancelBubble = true;
                    const origin = enemyTokenCells[enemy.instanciaId] ?? { col: enemy.col, row: enemy.row };
                    setEnemyDragOriginCell(origin);
                    setEnemyDragCurrentCell(null);
                    draggingEnemyRef.current = { instanciaId: enemy.instanciaId, originCell: origin, currentCell: origin };
                  }}
                >
                  <Circle
                    x={ex} y={ey} radius={tokenRadius}
                    fill="rgba(160,22,26,0.88)"
                    stroke="#e83030"
                    strokeWidth={1.5}
                  />
                  <EnemyImgNode nombre={enemy.nombre} x={ex} y={ey} radius={tokenRadius} />
                  {canManage && esMaster && (
                    <Circle
                      x={ex} y={ey}
                      radius={tokenRadius + 5}
                      fillEnabled={false}
                      stroke="rgba(255,68,68,0.7)"
                      strokeWidth={2}
                      dash={[4, 3]}
                      listening={false}
                    />
                  )}
                  <Text
                    x={ex - tokenRadius} y={ey - tokenRadius}
                    width={tokenRadius * 2} height={tokenRadius * 2}
                    text={initials}
                    align="center" verticalAlign="middle"
                    fill="#fff" fontStyle="bold"
                    fontSize={Math.max(8, tokenRadius * 0.7)}
                    visible={false}
                  />
                </Group>
              );
            })}
          </Layer>
        )}

        {/* Layer 5: tokens de trampas — solo visibles para el master */}
        {trapTokens.length > 0 && (
          <Layer listening={false}>
            {trapTokens.map((trap) => {
              const canSeeTrap = esMaster || revealedTrapIds?.has(trap.instanciaId);
              if (!canSeeTrap) return null;
              const px = cellToPixel(trap.col, trap.row);
              const tx = mapOriginX + px.x * renderScale;
              const ty = mapOriginY + px.y * renderScale;
              const initials = trap.nombre.slice(0, 2).toUpperCase();
              return (
                <Group key={trap.instanciaId}>
                  <Circle
                    x={tx} y={ty} radius={tokenRadius}
                    fill="rgba(180,100,20,0.88)"
                    stroke="#e08030"
                    strokeWidth={1.5}
                  />
                  <TrapImgNode url={trap.imageUrl} x={tx} y={ty} radius={tokenRadius} />
                  <Text
                    x={tx - tokenRadius} y={ty - tokenRadius}
                    width={tokenRadius * 2} height={tokenRadius * 2}
                    text={initials}
                    align="center" verticalAlign="middle"
                    fill="#fff" fontStyle="bold"
                    fontSize={Math.max(8, tokenRadius * 0.7)}
                    visible={false}
                  />
                </Group>
              );
            })}
          </Layer>
        )}
      </Stage>

      <ModalAlert
        isOpen={canSeeConflict}
        title="Conflicto detectado"
        message={enemyConflict ? `${enemyConflict.attacker === 'personaje' ? 'El personaje' : 'El enemigo'} ha quedado junto a su objetivo.` : ''}
        confirmText={(() => {
          if (!enemyConflict) return 'Aceptar';
          const viewerIsAttacker = (
            (esMaster && enemyConflict.attacker === 'enemigo') ||
            (!esMaster && enemyConflict.attacker === 'personaje' && miPersonajeId && miPersonajeId.toString() === enemyConflict.tokenId.toString())
          );
          return viewerIsAttacker ? 'Atacar' : 'Defender';
        })()}
        cancelText="Cerrar"
        onConfirm={() => {
          dismissedConflictKeyRef.current = currentConflictKeyRef.current;
          setEnemyConflict(null);
        }}
        onCancel={() => {
          dismissedConflictKeyRef.current = currentConflictKeyRef.current;
          setEnemyConflict(null);
        }}
        showImage={false}
        media={enemyConflict ? (
          <div className="modal-conflict-avatars">
            {/* Player avatar */}
            <div className="modal-conflict-avatar player" title={enemyConflict.tokenName} style={{ borderColor: tokens.find(t => t.id === enemyConflict.tokenId)?.color }}>
              {(() => {
                const tk = tokens.find(t => t.id === enemyConflict.tokenId);
                if (!tk) return <span className="initials">?</span>;
                if (tk.avatarUrl) return <img src={tk.avatarUrl} alt={tk.initials} />;
                return <span className="initials">{tk.initials}</span>;
              })()}
            </div>

            <div className="modal-conflict-vs">VS</div>

            {/* Enemy avatar */}
            <div className="modal-conflict-avatar enemy" title={enemyConflict.enemyName}>
              {(() => {
                const key = getEnemigoImageKey(enemyConflict.enemyName);
                const png = `/images/enemigos/${key}Enemigo.png`;
                const jpg = `/images/enemigos/${key}Enemigo.jpg`;
                return (
                  <img
                    src={png}
                    alt={enemyConflict.enemyName}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = jpg; }}
                  />
                );
              })()}
            </div>
          </div>
        ) : null}
      />

      {/* Modal aviso cepo */}
      <ModalAlert
        isOpen={trapState?.phase === 'warning'}
        title={trapState?.phase === 'warning' ? getTrapTexts(trapState.nombre, trapState.imageUrl).title : ''}
        message={trapState?.phase === 'warning' ? getTrapTexts(trapState.nombre, trapState.imageUrl).message : ''}
        confirmText="Lanzar dado"
        showImage={false}
        onConfirm={() => {
          if (trapState?.phase === 'warning') {
            setTrapState({ phase: 'rolling', instanciaId: trapState.instanciaId, nombre: trapState.nombre, imageUrl: trapState.imageUrl, prevCol: trapState.prevCol, prevRow: trapState.prevRow });
          }
        }}
        media={(() => {
          if (trapState?.phase !== 'warning') return null;
          const playerToken = tokens.find(t => t.id === miPersonajeId);
          const activeTrap = trapTokens.find(t => t.instanciaId === trapState.instanciaId);
          return (
            <div className="gb-trap-media">
              <div className="modal-conflict-avatars">
                <div
                  className="modal-conflict-avatar player"
                  style={{ borderColor: playerToken?.color ?? 'rgba(80,170,240,0.9)' }}
                >
                  {playerToken?.avatarUrl
                    ? <img src={playerToken.avatarUrl} alt="personaje" />
                    : <span className="initials">{playerToken?.initials ?? 'PJ'}</span>
                  }
                </div>
                <div className="modal-conflict-vs">VS</div>
                <div
                  className="modal-conflict-avatar"
                  style={{ borderColor: 'rgba(200,130,20,0.95)' }}
                >
                  {activeTrap?.imageUrl
                    ? <img src={activeTrap.imageUrl} alt="trampa" style={{ objectFit: 'contain', padding: '8px' }} />
                    : <span className="initials">⚠</span>
                  }
                </div>
              </div>
              <div className="gb-trap-dice-legend">
                <div className="gb-trap-dice-item">
                  <img src="/images/dadosModHistoria/daño.png" alt="daño" className="gb-trap-dice-img" />
                  <span className="gb-trap-dice-label bad">Pierdes</span>
                </div>
                <div className="gb-trap-dice-item">
                  <img src="/images/dadosModHistoria/defensa.png" alt="defensa" className="gb-trap-dice-img" />
                  <span className="gb-trap-dice-label good">Ganas</span>
                </div>
                <div className="gb-trap-dice-item">
                  <img src="/images/dadosModHistoria/victoriaEnemigo.png" alt="victoria" className="gb-trap-dice-img" />
                  <span className="gb-trap-dice-label good">Ganas</span>
                </div>
              </div>
            </div>
          );
        })()}
      />

      {/* Dado de cepo */}
      {trapState?.phase === 'rolling' && (
        <StoryModeDiceRoller
          cantidadResultados={1}
          label="d6"
          onFin={(imagenes) => {
            const resultado   = imagenes[0];
            const instanciaId = trapState.instanciaId;
            const tipo        = classifyTrap(trapState.nombre, trapState.imageUrl);
            const activeTrap  = trapTokens.find(t => t.instanciaId === instanciaId);
            const trapCol     = activeTrap?.col ?? 0;
            const trapRow     = activeTrap?.row ?? 0;
            const { prevCol, prevRow, imageUrl } = trapState;

            // Siempre eliminar la trampa del tablero
            onTrapTriggered?.(instanciaId, 'superado');

            if (resultado === 'daño' && tipo === 'bomba') {
              setTrapState({ phase: 'bomba-exploto', imageUrl });
            } else if (resultado === 'daño' && tipo === 'derrumbe') {
              setTrapState({ phase: 'derrumbe-exploto', imageUrl, trapCol, trapRow, prevCol, prevRow });
            } else {
              setTrapState(null);
              if (resultado === 'daño' && tipo === 'cepo' && miPersonajeId) {
                sendFinTurno?.(miPersonajeId);
              }
            }
          }}
        />
      )}

      {/* Modal derrumbamiento */}
      <ModalAlert
        isOpen={trapState?.phase === 'derrumbe-exploto'}
        title="¡Derrumbamiento!"
        message="El techo se ha derrumbado. Debes infligir un punto de daño a tu personaje. La casilla queda bloqueada."
        confirmText="Cerrar"
        showImage={false}
        onConfirm={() => {
          if (trapState?.phase !== 'derrumbe-exploto') return;
          const { trapCol, trapRow, prevCol, prevRow } = trapState;
          onCellBlocked?.(trapCol, trapRow, trapState.imageUrl);
          if (miPersonajeId) {
            setTokenCells(prev => ({ ...prev, [miPersonajeId]: { col: prevCol, row: prevRow } }));
            onTokenMove?.(miPersonajeId, prevCol, prevRow);
          }
          setTrapState(null);
        }}
        media={trapState?.phase === 'derrumbe-exploto' ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="modal-conflict-avatar"
              style={{ borderColor: 'rgba(120,120,120,0.9)', width: '110px', height: '110px' }}
            >
              {trapState.imageUrl
                ? <img src={trapState.imageUrl} alt="derrumbamiento" style={{ objectFit: 'contain', padding: '8px' }} />
                : <span style={{ fontSize: '3rem' }}>🪨</span>
              }
            </div>
          </div>
        ) : null}
      />

      {/* Modal explosión de bomba */}
      <ModalAlert
        isOpen={trapState?.phase === 'bomba-exploto'}
        title="¡VAYA!"
        message="La bomba ha explotado y debes infligir dos puntos de daño a tu personaje."
        confirmText="Cerrar"
        showImage={false}
        onConfirm={() => setTrapState(null)}
        media={trapState?.phase === 'bomba-exploto' ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="modal-conflict-avatar"
              style={{ borderColor: 'rgba(255,150,0,0.9)', width: '110px', height: '110px' }}
            >
              {trapState.imageUrl
                ? <img src={trapState.imageUrl} alt="bomba" style={{ objectFit: 'contain', padding: '8px' }} />
                : <span style={{ fontSize: '3rem' }}>💥</span>
              }
            </div>
          </div>
        ) : null}
      />

      {pendingDoor && trapState === null && !enemyConflict && (
        <StoryModeDoorModal
          door={pendingDoor}
          onOpen={() => {
            const roomId = pendingDoor.roomId;
            setRooms(prev => prev.map((room) => (
              room.id === roomId || (roomId === 'sala4b' && room.id === 'sala4a')
                ? { ...room, revealed: true }
                : room
            )));
            setPendingDoor(null);
            onRoomRevealed?.(roomId);
            if (roomId === 'sala4b') onRoomRevealed?.('sala4a');
          }}
          onOpenDouble={() => openRoomDouble(pendingDoor)}
          onCancel={() => {
            setPendingDoor(null);
          }}
        />
      )}
    </div>
  );
}
