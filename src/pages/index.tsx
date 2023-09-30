import Image from 'next/image'
import Link from 'next/link'
import { Inter } from 'next/font/google'

import rule1 from '../../public/rule1.png'
import rule2 from '../../public/rule2.png'
import rule3 from '../../public/rule3.png'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center p-24 bg-white dark:bg-black ${inter.className}`}
    >
      <h1 className={`mb-2 text-4xl font-semibold`}>
        LIFE TILE
      </h1>
      <div className="mb-2 grid text-center">
        <Link href="/play" className={"bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"}>
          Play
        </Link>
      </div>
      <div className="mb-2 lg:mb-0 lg:grid-cols-4 lg:text-left">
        <h2 className={`mb-2 mt-6 text-2xl font-semibold`}>
          HOW TO PLAY
        </h2>
        <ul className={"list-disc"}>
          <li>
            人数: 2人
          </li>
          <li>
            1回のプレイ時間: ~5分
          </li>
        </ul>
        <h3 className={`mb-2 mt-6 text-xl font-semibold`}>
          ルール
        </h3>
        <ul className={"list-decimal"}>
          <li className={`mt-4 mb-2`}>
            各プレイヤーは交互に自分の色の長方形のタイルを置いていきます。
            <div className="flex justify-center">
              <Image src={rule1} alt="1" width={300} height={300}/>
            </div>
          </li>
          <li className={`mt-4 mb-2`}>
            タイルは盤面の格子に合わせて置きます。すでに置かれているタイルに被らなければどのような大きさでも構いません。
            <div className="flex justify-center">
              <Image src={rule2} alt="1" width={300} height={300}/>
            </div>
          </li>
          <li className={`mt-4 mb-2`}>
            プレイヤーがタイルを置いて盤面が全て埋まったとき、そのプレイヤーの負けです。
            <div className="flex justify-center">
              <Image src={rule3} alt="1" width={300} height={300}/>
            </div>
          </li>
        </ul>
      </div>
    </main>
  )
}
