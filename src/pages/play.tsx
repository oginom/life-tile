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

const TileView: FC<Tile & TransformProps> = ({ color, transform }) => {
  const fill = colorToHex(color)
  return <Rect fill={fill} {...transformProps(transform)} />
}

type Game = {
  turn: number
  tiles: number[][]
}

const RetryButton: FC<any> = (props) => {
  return <Group>
    <Rect fill='gray' width={200} height={100} {...props} x={props.x - 100} y={props.y - 50} onClick={props.callback} />
    <Text text={"RETRY"} {...props} />
  </Group>
}

const GameView: FC<Game & TransformProps & {handleRetry: any}> = ({ tiles, handleRetry, transform }) => {

  const W = tiles[0].length
  const H = tiles.length
  const tileSize = {
    x: transform.size.x / W,
    y: transform.size.y / H,
  }
  const tilesView = tiles.map((row, y) => {
    return row.map((color, x) => {
      return <TileView key= {`${x}-${y}`} color={color} transform={{
        scale: { x: 1, y: 1 },
        pos: { x: x * tileSize.x, y: y * tileSize.y },
        size: tileSize
      }} />
    })
  })

  return <Layer>
      {tilesView}
      {/* gameOver && <RetryButton x={300} y={300} callback={handleRetry} /> */}
    </Layer>
}

type GameStage = {
  handleClick: any
  handleRetry: any
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

const GameStageView: FC<GameStage> = ({ handleClick, handleRetry, windowSize, width, height, game }) => {
  const scale = Math.min((windowSize.width) / width, (windowSize.height) / height);
  const gameTransform: RectTransform = {
    scale: { x: 1, y: 1 },
    pos: { x: (windowSize.width - width * scale) / 2, y: (windowSize.height - height * scale) / 2 },
    size: { x: width, y: height },
  }
  return <Stage width={width * scale} height={height * scale} scaleX={scale} scaleY={scale} className="flex justify-center" onKeyPress={(e: any) => console.log(e)} onClick={() => handleClick()} onTouchStart={() => handleClick()}>
    <GameView {...game} handleRetry={handleRetry} transform={gameTransform}/>
    <Layer>
      <Rect stroke='black' strokeWidth={4} x={2} y={2} width={width-4} height={height-4} />
    </Layer>
  </Stage>
}

//// ループで実行したい処理 を callback関数に渡す
//const useAnimationFrame = (callback = () => {}) => {
//  const reqIdRef = useRef(0);
//  // useCallback で callback 関数が更新された時のみ関数を再生成
//  const loop = useCallback(() => {
//    reqIdRef.current = requestAnimationFrame(loop);
//    callback();
//  }, [callback]);
//
//  useEffect(() => {
//    reqIdRef.current = requestAnimationFrame(loop);
//    return () => cancelAnimationFrame(reqIdRef.current);
//    // loop を依存配列に
//  }, [loop]);
//};

const GND = 623

export default function Home() {

  const [game, setGame] = useState({
    //t: 0,
    //spawner: { prevT: 0 },
    //player: {
    //  t: 0,
    //  pos: {x: 275, y: GND},
    //  disp_d: {x: 0, y: 0},
    //  v: {x: 0, y: 0},
    //  jumping: true,
    //  fated: false,
    //},
    //enemies: Array<Enemy>(),
    //gameOver: false,
    turn: 1,
    tiles: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1],
      [2, 2, -1, 0, 0],
      [2, 2, 0, 0, 0],
      [2, 2, 0, -1, 0],
    ],
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
  })

  const jump = () => {
    console.log("jump")
  }

  const handleClick = () => {
    jump()
  }

  const handleRetry = () => {
    console.log("handle retry")
  }

  const W = 600;
  const H = 600;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="z-10 w-full h-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <GameStageView handleClick={() => handleClick()} handleRetry={handleRetry} windowSize={windowSize} width={W} height={H} game={game} />
      </div>
      <KeyboardEventHandler />
    </main>
  )
}
