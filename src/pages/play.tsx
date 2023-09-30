/* eslint-disable jsx-a11y/alt-text */

import { Image, Layer, Rect, Stage, Text, Group } from "react-konva";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import useImage from 'use-image';
//import { atom, useRecoilState, useRecoilValue } from "recoil";

//const timeState = atom({
//  key: 'time',
//  default: 0
//});

// viewer ?

type Vec2 = {
  x: number
  y: number
}

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
  const onTouchEndPc = () => {
    onTouchEnd(false)
  }
  const onTouchEndSp = () => {
    onTouchEnd(true)
  }
  return <Rect stroke={"#CCCCCC"} strokeWidth={6} fill={fill} {...transformProps(transform, 6)}
  onMouseDown={onTouchStart} onMouseEnter={onTouchEnter} onMouseUp={onTouchEndPc}
  onTouchStart={onTouchStart} onTouchMove={onTouchEnter} onTouchEnd={onTouchEndSp} />
}

type Range = {
  l: number
  r: number
  t: number
  b: number
}

type Selection = {
  player: number
  range: Range
  thinkTime: number
}

type Game = {
  players: PlayserState[]
  firstPlayer: number
  turn: number
  loser: number
  tiles: number[][]
  history: Selection[]
  selecting: Range | null
}

const initialGame = () => {
  const tiles = [...Array(6)].map(() => [...Array(6)].map(() => 0))
  tiles[Math.floor(Math.random() * 6)][Math.floor(Math.random() * 6)] = -1
  tiles[Math.floor(Math.random() * 6)][Math.floor(Math.random() * 6)] = -1
  tiles[Math.floor(Math.random() * 6)][Math.floor(Math.random() * 6)] = -1

  return {
    players: [
      { player: 1, score: 0, totalScore: 0 },
      { player: 2, score: 0, totalScore: 0 },
    ],
    firstPlayer: 1,
    turn: 1,
    loser: -1,
    tiles: tiles,
    selecting: null,
    history: [],
  }
}

type GameViewProps = {
  handleSelectRange: any
  handleGet: any
  canGet: boolean
}

const GetButton: FC<TransformProps & {callback: any, enabled: boolean, listening: boolean}> = ({transform, callback, enabled, listening}) => {

  //const t = useRecoilValue(timeState);

  //const dy = Math.abs(Math.sin(t * 0.004)) * -0;
  const dy = 0;

  const transform3 = {...transform, pos: {...transform.pos, y: transform.pos.y + 3}};
  const transform2 = {...transform, pos: {...transform.pos, y: transform.pos.y + dy}};

  // TODO: pass through touch events
  return <Group>
    <Rect fill={'rgba(1,1,1,0.25)'} {...transformProps(transform3)} listening={false}/>
    <Rect strokeWidth={2} stroke='black' fill={enabled ? 'white' : 'gray'} {...transformProps(transform2)} onClick={() => enabled && callback()} onTouchEnd={() => enabled && callback()} listening={listening}/>
    <Text text={"GET"} fontStyle="bold" {...transformProps(transform2)} align="center" verticalAlign="middle" listening={false}/>
  </Group>
}

const GameView: FC<Game & TransformProps & GameViewProps> = ({ tiles, history, selecting, turn, loser, transform, handleGet, canGet, handleSelectRange }) => {

  // こういうところで recoil の global state を使うべきなんじゃないか
  const [startTile, setStartTile] = useState<Vec2 | null>(null)

  const [skullImage] = useImage('skull.svg')

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
        handleSelectRange({ l: x, r: x, t: y, b: y }, false)
      }
      const onTouchEnter = () => {
        if (startTile != null) {
          const l = Math.min(x, startTile!.x)
          const r = Math.max(x, startTile!.x)
          const t = Math.min(y, startTile!.y)
          const b = Math.max(y, startTile!.y)
          handleSelectRange({ l: l, r: r, t: t, b: b }, false) 
        }
      }
      const onTouchEnd = (decide: boolean) => {
        if (startTile != null) {
          const l = Math.min(x, startTile!.x)
          const r = Math.max(x, startTile!.x)
          const t = Math.min(y, startTile!.y)
          const b = Math.max(y, startTile!.y)
          if (handleSelectRange({ l: l, r: r, t: t, b: b }, true) && decide) {
            handleGet()
          }
        }
        setStartTile(null)
      }
      return <TileView key= {`${x}-${y}`} color={color} transform={{
        scale: { x: 1, y: 1 },
        pos: { x: x * tileSize.x, y: y * tileSize.y },
        size: tileSize
      }} onTouchStart={onTouchStart} onTouchEnter={onTouchEnter} onTouchEnd={onTouchEnd} />
    })
  })

  const selectionViews = history.map((selection, i) => {
    const selectionIndexStr = (i + 1).toString()
    const range = selection.range
    const color = selection.player
    const thinkTimeInt = Math.floor(selection.thinkTime / 1000)
    const thinkTimeStr = `${Math.floor(thinkTimeInt / 60)}:${("0" + (thinkTimeInt % 60)).slice(-2)}`

    const transform = rangeTransform(range, tileSize)
    const transform2 = rangeTransform({
      ...range,
      r: range.r + 1,
    }, tileSize)
    const transform4 = rangeTransform({
      ...range,
      l: range.l - 1,
    }, tileSize)
    const transform3 = rangeTransform({
      l: range.r + 1,
      r: range.r + 2,
      t: range.b + 1,
      b: range.b + 2,
    }, tileSize)

    const rectTransformProps = transformProps(transform, 10)
    const point = (selection.range.r - selection.range.l + 1) * (selection.range.b - selection.range.t + 1)
    const isSkull = (selection.player == loser)
    const pointStr  = point.toString()

    return <Group key={i} clipX={rectTransformProps.x} clipY={rectTransformProps.y} clipWidth={rectTransformProps.width} clipHeight={rectTransformProps.height}>
      {true && <Rect fill={colorToHex(color)} strokeWidth={0} {...rectTransformProps} listening={false}/>}
      {false && <Text text={thinkTimeStr} fill="white" fontSize={Math.floor(tileSize.y * 0.5)} fontStyle="bold" {...transformProps(transform2)} rotation={45} align="left" verticalAlign="top" listening={false}/>}
      {true && <Text text={selectionIndexStr} fill="white" fontSize={Math.floor(tileSize.y)} fontStyle="bold" {...transformProps(transform3, 20)} offsetX={tileSize.x} offsetY={tileSize.y} rotation={-45} align="center" verticalAlign="top" listening={false}/>}
      {false && <Text text="LIFE" fill="white" fontSize={tileSize.y * 0.5} fontStyle="bold" {...transformProps(transform2, 0)} rotation={-5} align="left" verticalAlign="bottom" listening={false}/>}
      {false && <Text text="TILE" fill="white" fontSize={tileSize.y * 0.5} fontStyle="bold" {...transformProps(transform4, 0)} rotation={5} align="right" verticalAlign="top" listening={false}/>}
      {false && !isSkull && <Text text={pointStr} fill="white" fontSize={tileSize.y * 1.5} fontStyle="bold" {...transformProps(transform, -30)} align="center" verticalAlign="middle" listening={false}/>}
      {isSkull && <Image image={skullImage} {...transformProps(transform)}/>}
    </Group>
  })

  const selectingRectTransform: RectTransform | null = selecting ? {
    scale: { x: 1, y: 1 },
    pos: { x: selecting.l * tileSize.x, y: selecting.t * tileSize.y },
    size: { x: (selecting.r - selecting.l + 1) * tileSize.x, y: (selecting.b - selecting.t + 1) * tileSize.y },
  } : null

  const getButtonTransform: RectTransform | null = selecting ? {
    scale: { x: 1, y: 1 },
    pos: {
      x: (selecting.l + selecting.r + 1) * tileSize.x / 2 - tileSize.x * 0.3,
      y: (selecting.t + selecting.b + 1) * tileSize.y / 2 - tileSize.y * 0.2,
    },
    size: { x: tileSize.x * 0.6, y: tileSize.y * 0.4 },
  } : null

  return <Layer {...transformProps(transform)}>
      {tilesView}
      {selectionViews}
      { selecting && selectingRectTransform && getButtonTransform && <Group>
          <Rect stroke={colorToHex(turn)} strokeWidth={10} {...transformProps(selectingRectTransform, 20)} listening={false}/>
          <GetButton transform={getButtonTransform} callback={handleGet} enabled={canGet} listening={startTile == null}/>
        </Group>
      }
      {/* gameOver && <RetryButton x={300} y={300} callback={handleRetry} /> */}
    </Layer>
}

type GameStage = {
  handleClick: any
  handleGet: any
  canGet: boolean
  handleSelectRange: any
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

const transformProps = (rectTransform: RectTransform, stroke: number = 0) => {
  return {
    scaleX: rectTransform.scale.x,
    scaleY: rectTransform.scale.y,
    x: rectTransform.pos.x + stroke / 2,
    y: rectTransform.pos.y + stroke / 2,
    width: rectTransform.size.x * rectTransform.scale.x - stroke,
    height: rectTransform.size.y * rectTransform.scale.y - stroke,
  }
}

const rangeTransform = (range: Range, tileSize: Vec2) => {
  return {
    scale: { x: 1, y: 1 },
    pos: { x: range.l * tileSize.x, y: range.t * tileSize.y },
    size: { x: (range.r - range.l + 1) * tileSize.x, y: (range.b - range.t + 1) * tileSize.y },
  }
}

type PlayserState = {
  player: number
  totalScore: number
  score: number
}

const PlayserStateView: FC<TransformProps & PlayserState & {turn: boolean}> = ({transform, player, score, totalScore, turn}) => {

  const fitTransform: RectTransform = {
    scale: { x: 1, y: 1 },
    pos: { x: 0, y: 0 },
    size: { x: transform.size.x / transform.scale.x, y: transform.size.y / transform.scale.y },
  }

  const turnTransform: RectTransform = {
    scale: { x: 1, y: 1 },
    pos: { x: 0, y: 0 },
    size: { x: fitTransform.size.x / 2, y: fitTransform.size.y / 2 },
  }

  return <Layer {...transformProps(transform)}>
    <Rect strokeWidth={2} stroke='black' fill={colorToHex(player)} {...transformProps(fitTransform, 2)} />
    <Text text={`${score}`} fontSize={Math.floor(transform.size.y * 0.5)} fontStyle="bold" fill="white" {...transformProps(fitTransform)} align="center" verticalAlign="middle" listening={false}/>
    <Text text={`${totalScore}`} fontSize={Math.floor(transform.size.y * 0.2)} fontStyle="bold" fill="white" {...transformProps(fitTransform)} align="right" verticalAlign="top" listening={false}/>
    {turn && <Text text={"TURN"} fontSize={Math.floor(transform.size.y * 0.2)} fontStyle="bold" fill="white" {...transformProps(fitTransform, 30)} align="left" verticalAlign="top" listening={false}/>}
  </Layer>
}

const GameStageView: FC<GameStage> = ({ handleClick, handleGet, canGet, handleSelectRange, windowSize, game }) => {
  const width = 600;
  const height = 600;

  const verticalLayout = windowSize.width / 2 < windowSize.height * (3/4)

  var scale: number
  var gameTransform: RectTransform
  var playerTransforms: RectTransform[]
  if (verticalLayout) {
    scale = Math.min((windowSize.width) / width, (windowSize.height) / (height * (4/3)));
  } else {
    scale = Math.min((windowSize.width) / width, (windowSize.height) / height);
  }

  gameTransform = {
    scale: { x: 1, y: 1 },
    pos: { x: (windowSize.width / scale - width) / 2, y: 0 },
    size: { x: width, y: height },
  }
  playerTransforms = [{
    scale: { x: 1, y: 1 },
    pos: { x: (windowSize.width / scale - width) / 2, y: height },
    size: { x: width / 2, y: height * (1/3) },
  }, {
    scale: { x: 1, y: 1 },
    pos: { x: (windowSize.width / scale) / 2, y: height },
    size: { x: width / 2, y: height * (1/3) },
  }]

  const players = game.players.map((player, i) => {
    return <PlayserStateView transform={playerTransforms[i]} {...player} turn={player.player == game.turn} key={i}/>
  })

  return <Stage width={windowSize.width} height={windowSize.height} scaleX={scale} scaleY={scale} className="flex justify-center" onTouchEnd={handleClick} onMouseUp={handleClick}>
    <GameView {...game} handleGet={handleGet} canGet={canGet} handleSelectRange={handleSelectRange} transform={gameTransform}/>
    {false && players}
    <Layer listening={false}>
      <Rect stroke='black' strokeWidth={4} {...transformProps(gameTransform, 4)} listening={false}/>
      <Text text='LIFE TILE' fill='white' fontSize={Math.floor(gameTransform.size.y * 0.03)} fontStyle="bold" {...transformProps(gameTransform, 4)} align="right" verticalAlign="bottom" listening={false}/>
    </Layer>
  </Stage>
}

// ループで実行したい処理 を callback関数に渡す
const useAnimationFrame = (callback = (ts: number) => {}) => {
  const reqIdRef = useRef(0);
  // useCallback で callback 関数が更新された時のみ関数を再生成
  const loop = useCallback((ts: number) => {
    reqIdRef.current = requestAnimationFrame(loop);
    callback(ts);
  }, [callback]);

  useEffect(() => {
    reqIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqIdRef.current);
    // loop を依存配列に
  }, [loop]);
};

export default function Home() {
  const [game, setGame] = useState<Game>(initialGame())
  //const [ts, setTS] = useRecoilState(timeState)
  //const [tsPrev, setTSPrev] = useState(0)

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

  const [canGet, setCanGet] = useState(true)

  //useAnimationFrame((_ts) => {
  //  setTS(_ts);
  //});

  const [restart, setRestart] = useState(false)

  const handleClick = () => {
    if (game.loser != -1) {
      if (!restart) {
        setRestart(true)
        return
      }
      setGame((prev) => ({...initialGame(), 
        firstPlayer: prev.firstPlayer % prev.players.length + 1,
        turn: prev.firstPlayer % prev.players.length + 1,
        players: prev.players,
      } as Game))
      setRestart(false)
    }
  }

  const selectingArea = (range: Range) => {
    return (range.r - range.l + 1) * (range.b - range.t + 1)
  }

  const handleGet = () => {
    if (game.selecting == null) {
      return
    }

    // TODO?: check if the range is valid
    for (let y = game.selecting.t; y <= game.selecting.b; y++) {
      for (let x = game.selecting.l; x <= game.selecting.r; x++) {
        game.tiles[y][x] = game.turn
      }
    }

    const newHistory = game.history.concat({
      player: game.turn,
      range: game.selecting,
      //thinkTime: ts - tsPrev,
      thinkTime: 0,
    })
    //setTSPrev(ts)

    var newPlayers = game.players.map((player) => {
      if (player.player == game.turn) {
        return {
          ...player,
          score: player.score + selectingArea(game.selecting!),
          totalScore: player.totalScore,
        }
      } else {
        return player
      }
    })

    if (game.tiles.every((row) => row.every((tile) => tile != 0))) {
      // finish the game
      game.loser = game.turn
      game.turn = -1
      game.selecting = null
      newPlayers = newPlayers.map((player) => {
        if (player.player == game.loser) {
          return {
            ...player,
            score: 0,
          }
        } else {
          return {
            ...player,
            totalScore: player.totalScore + player.score,
            score: 0,
          }
        }
      })
    } else {
      // continue the game
      game.turn = game.turn % game.players.length + 1
      game.selecting = null
    }

    setGame((prev) => ({
      ...prev,
      players: newPlayers,
      loser: game.loser,
      tiles: game.tiles.concat(),
      history: newHistory,
      selecting: game.selecting,
      turn: game.turn,
    }))
    setCanGet(game.tiles[0][0] == 0)
  }

  const handleSelectRange = (range: Range, final: boolean) => {
    console.log("handle select range")
    if (game.turn < 0) {
      return false
    }
    var canGet = true
    for (let y = range.t; y <= range.b; y++) {
      for (let x = range.l; x <= range.r; x++) {
        if (game.tiles[y][x] != 0) {
          canGet = false
        }
      }
    }
    setGame((prev) => ({
      ...prev,
      selecting: (canGet || !final) ? range : null,
    }))
    setCanGet(canGet)
    return canGet
  }

  return (
    <main className="bg-white dark:bg-black">
      <div className="">
        <GameStageView handleClick={handleClick} handleGet={handleGet} canGet={canGet} handleSelectRange={handleSelectRange} windowSize={windowSize} game={game} />
      </div>
    </main>
  )
}
