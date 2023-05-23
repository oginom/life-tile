/* eslint-disable jsx-a11y/alt-text */

import { Layer, Rect, Circle, Ellipse, Line, Stage, Image, Text, Group } from "react-konva";
import { Inter } from 'next/font/google'
import { FC, useCallback, useEffect, useRef, useState } from "react";
import useImage from 'use-image';
import { atom, useSetRecoilState, useRecoilValue } from 'recoil';

const SHOW_BOUNDING_BOX = false

const keyboardState = atom({
  key: 'keyboardState',
  default: {},
});

function KeyboardEventHandler() {
  const setKeyboardState = useSetRecoilState(keyboardState);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      setKeyboardState((prev) => ({
        ...prev,
        [event.code]: true,
      }));
    };

    const handleKeyUp = (event: any) => {
      setKeyboardState((prev) => ({
        ...prev,
        [event.code]: false,
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return null;
}

const inter = Inter({ subsets: ['latin'] })

// viewer ?

type Vec2 = {
  x: number
  y: number
}

type Charactor = "TIGER" | "VELOCI" | "MICRO"

type Tile = {
  color: number
}

const colorToHex = (color: number) => {
  if (color == 0) {
    return "white"
  } else if (color == -1) {
    return "black"
  } else if (color == 1) {
    return "#FF6666" // red
  } else if (color == 2) {
    return "#6666FF" // blue
  } else {
    return "red"
  }
}

type TileViewProps = {
  onTouchStart: any
  onTouchEnter: any
  onTouchEnd: any
}

const TileView: FC<Tile & TransformProps & TileViewProps> = ({ color, transform, onTouchStart, onTouchEnter, onTouchEnd }) => {
  const fill = colorToHex(color)
  return <Rect fill={fill} {...transformProps(transform)}
  onMouseDown={onTouchStart} onMouseEnter={onTouchEnter} onMouseUp={onTouchEnd}
  onTouchStart={onTouchStart} onTouchMove={onTouchEnter} onTouchEnd={onTouchEnd} />
}

type Range = {
  l: number
  r: number
  t: number
  b: number
}

type Game = {
  turn: number
  tiles: number[][]
  selecting: Range
}

type GameViewProps = {
  handleSelectRange: any
  handleGet: any
}

const GetButton: FC<TransformProps & {callback: any}> = ({transform, callback}) => {
  // TODO: pass through touch events
  return <Group>
    <Rect strokeWidth={2} stroke='black' fill='white' {...transformProps(transform)} onClick={callback} />
    <Text text={"GET"} fontStyle="bold" {...transformProps(transform)} align="center" verticalAlign="middle" listening={false}/>
  </Group>
}

const GameView: FC<Game & TransformProps & GameViewProps> = ({ tiles, selecting, turn, transform, handleGet, handleSelectRange }) => {

  // こういうところで recoil の global state を使うべきなんじゃないか
  const [startTile, setStartTile] = useState<Vec2 | null>(null)

  const W = tiles[0].length
  const H = tiles.length
  const tileSize = {
    x: transform.size.x / W,
    y: transform.size.y / H,
  }
  const tilesView = tiles.map((row, y) => {
    return row.map((color, x) => {
      const onTouchStart = () => {
        setStartTile({ x: x, y: y })
        handleSelectRange({ l: x, r: x, t: y, b: y })
      }
      const onTouchEnter = () => {
        if (startTile != null) {
          const l = Math.min(x, startTile!.x)
          const r = Math.max(x, startTile!.x)
          const t = Math.min(y, startTile!.y)
          const b = Math.max(y, startTile!.y)
          handleSelectRange({ l: l, r: r, t: t, b: b }) 
        }
      }
      const onTouchEnd = () => {
        setStartTile(null)
      }
      return <TileView key= {`${x}-${y}`} color={color} transform={{
        scale: { x: 1, y: 1 },
        pos: { x: x * tileSize.x, y: y * tileSize.y },
        size: tileSize
      }} onTouchStart={onTouchStart} onTouchEnter={onTouchEnter} onTouchEnd={onTouchEnd} />
    })
  })

  const selectingRectTransform: RectTransform = {
    scale: { x: 1, y: 1 },
    pos: { x: selecting.l * tileSize.x, y: selecting.t * tileSize.y },
    size: { x: (selecting.r - selecting.l + 1) * tileSize.x, y: (selecting.b - selecting.t + 1) * tileSize.y },
  }

  const getButtonTransform: RectTransform = {
    scale: { x: 1, y: 1 },
    pos: {
      x: (selecting.l + selecting.r + 1) * tileSize.x / 2 - tileSize.x * 0.25,
      y: (selecting.t + selecting.b + 1) * tileSize.y / 2 - tileSize.y * 0.15,
    },
    size: { x: tileSize.x * 0.5, y: tileSize.y * 0.3 },
  }

  return <Layer>
      {tilesView}
      <Rect stroke={colorToHex(turn)} strokeWidth={20} {...transformProps(selectingRectTransform)} listening={false}/>
      <GetButton transform={getButtonTransform} callback={handleGet}/>
      {/* gameOver && <RetryButton x={300} y={300} callback={handleRetry} /> */}
    </Layer>
}

type GameStage = {
  handleClick: any
  handleGet: any
  handleSelectRange: any
  width: number
  height: number
  windowSize: any
  game: Game
}

type RectTransform = {
  scale: Vec2,
  pos: Vec2, // top left
  size: Vec2,
}

type TransformProps = {
  transform: RectTransform
}

const transformProps = (rectTransform: RectTransform) => {
  return {
    scaleX: rectTransform.scale.x,
    scaleY: rectTransform.scale.y,
    x: rectTransform.pos.x,
    y: rectTransform.pos.y,
    width: rectTransform.size.x * rectTransform.scale.x,
    height: rectTransform.size.y * rectTransform.scale.y,
  }
}

const GameStageView: FC<GameStage> = ({ handleClick, handleGet, handleSelectRange, windowSize, width, height, game }) => {
  const scale = Math.min((windowSize.width) / width, (windowSize.height) / height);
  const gameTransform: RectTransform = {
    scale: { x: 1, y: 1 },
    pos: { x: (windowSize.width - width * scale) / 2, y: (windowSize.height - height * scale) / 2 },
    size: { x: width, y: height },
  }
  return <Stage width={width * scale} height={height * scale} scaleX={scale} scaleY={scale} className="flex justify-center" onTouchStart={() => handleClick()}>
    <GameView {...game} handleGet={handleGet} handleSelectRange={handleSelectRange} transform={gameTransform}/>
    <Layer listening={false}>
      <Rect stroke='black' strokeWidth={4} x={2} y={2} width={width-4} height={height-4} listening={false}/>
    </Layer>
  </Stage>
}

const GND = 623

export default function Home() {
  const [game, setGame] = useState({
    turn: 1,
    tiles: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, -1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, -1, 0],
    ],
    selecting: { l: 0, r: 0, t: 0, b: 0 },
  })

  const currentKeyboardState: any = useRecoilValue(keyboardState);

  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [])

  const jump = () => {
    console.log("jump")
  }

  const handleClick = () => {
    jump()
    setGame((prev) => ({
      ...prev,
      range: { l: 1, r: 2, t: 0, b: 0 },
    }))
  }

  const handleRetry = () => {
    console.log("handle retry")
  }

  const handleGet = () => {
    // TODO: check if the range is valid
    for (let y = game.selecting.t; y <= game.selecting.b; y++) {
      for (let x = game.selecting.l; x <= game.selecting.r; x++) {
        game.tiles[y][x] = game.turn
      }
    }
    setGame((prev) => ({
      ...prev,
      tiles: game.tiles,
      selecting: { l: 0, r: 0, t: 0, b: 0 },
      turn: game.turn == 1 ? 2 : 1
    }))
  }

  const handleSelectRange = (range: Range) => {
    console.log("handle select range")
    setGame((prev) => ({
      ...prev,
      selecting: range,
    }))
  }

  const W = 600;
  const H = 600;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="z-10 w-full h-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <GameStageView handleClick={handleClick} handleGet={handleGet} handleSelectRange={handleSelectRange} windowSize={windowSize} width={W} height={H} game={game} />
      </div>
      <KeyboardEventHandler />
    </main>
  )
}
