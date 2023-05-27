/* eslint-disable jsx-a11y/alt-text */

import { Layer, Rect, Stage, Text, Group } from "react-konva";
import { FC, useEffect, useState } from "react";

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
  return <Rect stroke={"#CCCCCC"} strokeWidth={2} fill={fill} {...transformProps(transform, 2)}
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
  players: PlayserState[]
  firstPlayer: number
  turn: number
  loser: number
  tiles: number[][]
  selecting: Range
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
    selecting: { l: 0, r: 0, t: 0, b: 0 },
  }
}

type GameViewProps = {
  handleSelectRange: any
  handleGet: any
  canGet: boolean
}

const GetButton: FC<TransformProps & {callback: any, enabled: boolean, listening: boolean}> = ({transform, callback, enabled, listening}) => {
  // TODO: pass through touch events
  return <Group>
    <Rect strokeWidth={2} stroke='black' fill={enabled ? 'white' : 'gray'} {...transformProps(transform)} onClick={() => enabled && callback()} onTouchEnd={() => enabled && callback()} listening={listening}/>
    <Text text={"GET"} fontStyle="bold" {...transformProps(transform)} align="center" verticalAlign="middle" listening={false}/>
  </Group>
}

const GameView: FC<Game & TransformProps & GameViewProps> = ({ tiles, selecting, turn, transform, handleGet, canGet, handleSelectRange }) => {

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
      x: (selecting.l + selecting.r + 1) * tileSize.x / 2 - tileSize.x * 0.3,
      y: (selecting.t + selecting.b + 1) * tileSize.y / 2 - tileSize.y * 0.2,
    },
    size: { x: tileSize.x * 0.6, y: tileSize.y * 0.4 },
  }

  return <Layer {...transformProps(transform)}>
      {tilesView}
      <Rect stroke={colorToHex(turn)} strokeWidth={20} {...transformProps(selectingRectTransform, 20)} listening={false}/>
      <GetButton transform={getButtonTransform} callback={handleGet} enabled={canGet} listening={startTile == null}/>
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
    <Text text={`${score}`} fontSize={Math.floor(transform.size.y * 0.5)} fontStyle="bold" {...transformProps(fitTransform)} align="center" verticalAlign="middle" listening={false}/>
    <Text text={`${totalScore}`} fontSize={Math.floor(transform.size.y * 0.2)} fontStyle="bold" {...transformProps(fitTransform)} align="right" verticalAlign="top" listening={false}/>
    {turn && <Text text={"TURN"} fontSize={Math.floor(transform.size.y * 0.2)} fontStyle="bold" {...transformProps(turnTransform)} align="center" verticalAlign="middle" listening={false}/>}
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

  return <Stage width={windowSize.width} height={windowSize.height} scaleX={scale} scaleY={scale} className="flex justify-center" onTouchStart={() => handleClick()}>
    <GameView {...game} handleGet={handleGet} canGet={canGet} handleSelectRange={handleSelectRange} transform={gameTransform}/>
    {players}
    <Layer listening={false}>
      <Rect stroke='black' strokeWidth={4} {...transformProps(gameTransform, 4)} listening={false}/>
      <Text text='LIFE TILE' fontSize={Math.floor(gameTransform.size.y * 0.03)} fontStyle="bold" {...transformProps(gameTransform)} align="right" verticalAlign="bottom" listening={false}/>
    </Layer>
  </Stage>
}

export default function Home() {
  const [game, setGame] = useState<Game>(initialGame())

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

  const jump = () => {
    console.log("jump")
  }

  const handleClick = () => {
    jump()
    if (game.loser != -1) {
      setGame((prev) => ({...initialGame(), 
        firstPlayer: prev.firstPlayer % prev.players.length + 1,
        turn: prev.firstPlayer % prev.players.length + 1,
        players: prev.players,
      } as Game))
      setCanGet(true)
    }
  }

  const selectingArea = (range: Range) => {
    return (range.r - range.l + 1) * (range.b - range.t + 1)
  }

  const handleGet = () => {
    // TODO?: check if the range is valid
    for (let y = game.selecting.t; y <= game.selecting.b; y++) {
      for (let x = game.selecting.l; x <= game.selecting.r; x++) {
        game.tiles[y][x] = game.turn
      }
    }

    var newPlayers = game.players.map((player) => {
      if (player.player == game.turn) {
        return {
          ...player,
          score: player.score + selectingArea(game.selecting),
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
    }

    setGame((prev) => ({
      ...prev,
      players: newPlayers,
      loser: game.loser,
      tiles: game.tiles.concat(),
      selecting: { l: 0, r: 0, t: 0, b: 0 },
      turn: game.turn,
    }))
    setCanGet(game.tiles[0][0] == 0)
  }

  const handleSelectRange = (range: Range) => {
    console.log("handle select range")
    setGame((prev) => ({
      ...prev,
      selecting: range,
    }))
    var canGet = true
    for (let y = range.t; y <= range.b; y++) {
      for (let x = range.l; x <= range.r; x++) {
        if (game.tiles[y][x] != 0) {
          canGet = false
        }
      }
    }
    setCanGet(canGet)
  }

  return (
    <main className="">
      <div className="">
        <GameStageView handleClick={handleClick} handleGet={handleGet} canGet={canGet} handleSelectRange={handleSelectRange} windowSize={windowSize} game={game} />
      </div>
    </main>
  )
}
