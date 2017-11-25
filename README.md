# &A ( Accelerator Language )

⚠ このプロジェクトは現状まだ企画段階であり、αレベルですらありません。

[名前だけ思いついてしまった](https://twitter.com/wraith13/status/923172054970507265)ので、とりあえず。
accelang ( 以下 &A と表記 ) は JSON 形式で記述する多目的マルチプラットフォーム言語(を目指している)。広義的には AltJS に該当するが、どちらかと言うと今現在必要としてる目的としては AltElectron であり、最終的にはスマフォなども動作対象プラットフォームとしてカバーしたいところ。

Electron は非常に便利なモノではあるが、造りが Web ブラウザであり、利用言語が JavaScript となってしまうこともあり、インストールを必要とする割には Web アプリと殆ど変わらないじゃないか！という残念なジレンマに陥っている。

&A の発想としては非Webアプリで利用するスクリプトであることを前提としつつも容易に Web ブラウザおよび Node.js 上でも動作させたい！　が、だからと言ってIT業界の現在進行形の黒歴史の一つである JavaScript は流石にいろいろな観点から避けたい！　というところが発想の起点のひとつであり、ネイティブバイナリ上あるいはネイティブバイナリそのものとして動作させることが主眼であり、そのあたりが JavaScript および Electron との根本的な違いのひとつとする。

## プレイグラウンド(実験場)

🚧 under construction
[&A experiment page](https://rawgit.com/wraith13/accelang/master/experiment/experiment.html)

## 言語名称

&A の命名は完全に冗談ではあるが &A を正式名称としつつも、検索性が悪くなることを意図した命名でもあるので検索性を鑑み公式のニックネームを accelang とし、それでも文章上は名前が短いことは一つの利点でもあるので、「accelang ( 以下 &A と表記 )」と言った形での運用を推奨。

> &A という表記はGUIのアクセラレーター由来であり[&]+[一文字]でアクセラレーターであり、 &A の A は Abyss の A 。

## 言語設計方針

* あわよくば到達したい目標は脱原始時代プログラミング環境。
* プログラマの判断を信頼・優先しつつも、プログラマのうっかりミスの検出を手堅くする。
* 本来、ツールがこなすべき作業を極力プログラマの手作業に依存しない。
* ダックタイピングを可能とするコンセプトベースの型システムとしてデザインし、静的検査を重視する。
* コンパイラ/インタプリタが頑張れば型定義や型の指定がなくともそれらがある場合と同等の静的検査が可能な場面であれば、コンパイラ/インタプリタが頑張る方向で。プログラマが頑張るべきところでないところで頑張らせない。
* Assert の類いは用意はするが、基本的に Assert が出てきたら負けという考えで、型を初めとする静的検査により代替できるようにする。
* 一発で殆どのバグを直すのに十分な情報を含むエラー情報を提供できることを目指す。この目標を果たす為、エラーに至ったコード上の由来情報であるスタックトレースにはそこに至るまでの全ての分岐情報を含め、また同時にデータ上の由来情報も同様に提供する。情報量が膨大になる為に完全な情報を提供できない場合でも、デバッグ上より効果的な情報を提供することを目指す。( ユーザープログラマによる printf デバッグや、一般的なデバッガのようなツールが役に立つことがあればこの目標的には負け )
* C++ のようなゼロオーバーヘッドは目指さない代わりに、&A言語システムおよび&Aプログラムのパフォーマンスを永続的に改善し続けられるように&A言語システムおよび&Aプログラムに対するプロファイラを提供する。
* できるだけ近代的な言語の便利な機能は一通り入れたいけど、まぁ、そのあたりはいろいろ状況を見つつ・・・
* 将来的な機能としたいが最初からその前提でいないと後からの導入は厳しいと思われるので、関数の360°実行を考慮した設計とする。恐らく、実際に使える状態にしておかないことには「考慮」が有名無実化することが予想されるので、完全でなくとも初期から関数の360°実行を対応を目指す。
* 動作速度プロファイラ、フットプリントプロファイラ、トレーサー、カバレッジ計測などの機能も言語の基本機能として提供する( v1 リリースの必須要件 )
* JITプログラミング周りもできれば対応したい・・・
* 依存型とか頑張りたい気持ち。
* テキスト周りは出力/表示が行われる直前まで実際の文字列が生成されない枠組みを前提としたい。(文字列型は限りなく void * に近い型であり、文字列化は型情報的な死を意味するという思想から)
* printfデバッグおよびコメントアウトデバッグを言語機能としてサポートすることを検討。(前述のエラー情報により大半のケースでは不要になると思われるが、外部システムが絡む部分で必要になると思われる。)

## 由来情報

* 全ての分岐と全ての値をプログラマへ提供することを目標とするが、実際には簡単に膨大なデータ量に膨れあがってしまう為、データの刈り込みを行う。
* function に関しては原則的に呼び出し時点での function のコードと引数が分かっていればその内部での全ての分岐と全ての値をエミュレートできるので、由来情報記録の強制の指定がない場合は最も呼び出し元側となる function の引数と、実行されたコードの記録を行う。
* ⚠ ハードウェアによる浮動小数点演算は引数が同じでも微妙に異なる結果を返すことがあるので要注意。
* JITプログラミングの都合もあるので、本当にその時に実行されたコードを記録しておく必要がある。とは言え同じバージョンのコードであれば重複する記録する必要はなし。また、このことにより、JITプログラミングでなくとも、元コードが編集されても由来情報を有効性を保つことが可能となる。
* function であっても、由来情報記録の強制を指定することで procedure と同様に由来情報記録を行う。(これがないとエミュレートもできなくなる)
* 由来情報の記録はスコープ単位で行い、各スコープは指定に従い最初のN回分+最後のN回分の記録を保持する。
* 由来情報はあくまでソフトウェアが正常に稼働していることの確認および異常時の問題及び原因を把握する為の情報であり、それ以外での利用を禁止する。(とは言っても正にこの目的の為に由来情報のログ出力を行うコードが由来情報にアクセスできないと困るのでシステム的にはどうともできないかも)
* 由来情報を使うことによりホワイトボックステストおよびカバレッジ計測が容易となる。

## ソースコード概要

最終的には以下で述べる Gaia に統合したいが現状の都合からまずは Prometheus をベースとする。将来的に Prometheus は Deucalion と Gaia を結ぶ内部的な中間表現に留まる形にしたい。
全てのプレーンテキストおよび JSON の文字エンコードは BOM 無し UTF-8 とする。
JSONで指定されるべき項目が存在しない場合は null が指定された場合と等価に扱う。

### Gaia(フォーマルJSONソースコード)

* JSON形式での記述を前提とする。
* BASIC言語での中間表現的なモノに相当する。ただし、当言語においてはこれこそがマスターであり真のソースコードとして扱う。
* JSON形式なので当然全てのコードはコメントまで含めてデータとして記述する形になる。
* インタプリタやコンパイラを作成するに当たって原則としてJSON以外のパーザーを一切必要としないことを前提とする。
* JSON以外のパーザーを用意しないので、オブジェクト指向対応言語でよくある aaa.bbb.ccc と言った具合のメンバー参照の記述も [ "aaa", "bbb", "ccc" ] と言った具合( この表現自体は仮。実際にどのような形にするかはまだ思案中 )にパーザーを利用しない形での記述を要求する。
* プログラマによる読み書きは最終的には専用のエディタで行う形としたいが通常のテキストエディタでも可能なものとする。
* 通常のテキストエディタでも読み書き可能なものとするのは専用のエディタが存在しない現状の都合であって、プログラムによる読み書きのしやすさの方を優先する。

### Prometheus(シンプルJSONソースコード)

* JSON形式での記述を前提とする。
* Gaia ではあまりに冗長となる為、簡素且つ省略的な JSON での表現。
* Deucalion との違いは JSON 形式かプレーンテキスト形式かの違い。
* JSON形式なので当然全てのコードはコメントまで含めてデータとして記述する形になる。
* インタプリタやコンパイラを作成するに当たって原則としてJSON以外のパーザーを一切必要としないことを前提とする。
* JSON以外のパーザーを用意しないので、オブジェクト指向対応言語でよくある aaa.bbb.ccc と言った具合のメンバー参照の記述も [ "aaa", "bbb", "ccc" ] と言った具合( この表現自体は仮。実際にどのような形にするかはまだ思案中 )にパーザーを利用しない形での記述を要求する。
* Gaia とは異なりプログラマによる読み書きを優先する。

### Deucalion(プレーンテキストソースコード)

* プログラマ向けのプレーンテキスト形式。
* 専用のパーザーを必要とする。

## Uranus(メタデータ)

* JSON形式での記述を前提とする。
* プログラマが直接的に参照することは考慮しない。
* プロファイリングデータ
* カバレッジデータ
* 最終的にはBTSやVCSを内包することを考えたいが当面はその考慮すらしない

## 言語構文

```json
{ "&": "*", "*": [ "console", "log", { "Hello, &A!" } ] }
```

```json
{
    "&": "call",
    "target": {
        "&": "member",
        "scope": "console",
        "member": "log"
    },
    "params": {
        "text": {
            "&": "literal",
            "type": "string",
            "value": "Hello, &A!"
        }
    }
}
```

```json
{
    "&": "function",
    "name": "user-add",
    "results": {
        "result": {
            "&": "value",
            "type": "number"
        }
    },
    "params": {
        "a": {
            "&": "value",
            "type": "number"
        },
        "b": {
            "&": "value",
            "type": "number"
        }
    },
    "code": {
        "&": "let",
        "target": "result",
        "params": {
            "value": {
                "&": "call",
                "target": {
                    "scope": "system",
                    "name": "add"
                },
                "params": {
                    "a": {
                        "&": "value",
                        "name": "a"
                    },
                    "b": {
                        "&": "value",
                        "name": "b"
                    }
                }
            }
        }
    }
}
```

## システム予約語

&で始まる識別子はシステム予約語とする。

## 組み込み型

### any

### bool

### int

### float

### string

### array

### object

## 制御文

### if

### switch

### for

for-each な構文を前提にする

### while

### goto

### return

## 関数の種類

全ての関数は次のどちらかとなる。

### procedure

副作用を持ち 360°実行はできない関数。
procedure からは procedure も function な関数も呼び出せる。
procedure からはグローバル変数の類いへのアクセスも可能。(とは言っても一般的な言語と同様のアプローチにするかは思案中。コンテキストベースにするかも。)
procedure から呼び出せる procedure および function は同一パッケージ内の procedure および function か、 require 指定されたパッケージの procedure および function のみ。
並列実行指定がない限りにおいては逐次実行で、並列実行指定がなされている箇所については並列実行(可能であれば並列実行)。
メモ化やエディットタイムによる定数化には非対応。
メモ化はないにしても、標準でのキャッシュの枠組みは提供しても良いかも。。。

### function

副作用を持たない360°実行が可能な関数。
function からは function しか呼び出さない。
function からアクセス可能な値は引数(thisは引数扱い)で指定された値か、定数のみ。グローバル変数の類いへのアクセスは不可。
function から呼び出せる function は同一パッケージ内の function か、 require 指定されたパッケージの function のみ。
遅延評価ベースでメモ化対応し、定数のみを元にして呼び出される場合においてエディットタイムに実行し、結果を定数化( or メモ化メタデータの埋め込み)に対応。

> 引数がなく定数を返す関数は扱いとしては function になるが実用上は360°実行ができる意味はほぼない。この関数を逆実行する際、正実行した場合に返す定数と同じ値を使って呼び出すとなにも起きず、異なる値を使って呼び出すと inconsistency exception が発生する。

## ステートメント

各種 if, switch 等々のステートメントは可能な限りユーザー定義できる形にした上で、標準的なステートメントは全て標準ライブラリ中で提供する。

### 関数呼び出し

### 関数定義

### クラス定義

## ライブラリ

### 標準ライブラリ

とりあえず、以下の系統を必要になったところから手をつけていく。実際に必要になったところの必要な部分だけ実装していく。

#### 標準コアライブラリ

* 文字列系
* コレクション系
* リフレクション系(型情報系、eval等も含む)
* 数学系
* 多倍長整数、多倍長実数
* 日時系
* 色系
* 座標系
* コンソール系
* ファイルI/O
* ネットワーク系
* 2D描画系
* ユーザー入力系
* GUI系

### パッケージシステム

パッケージシステムは肝のひとつだし、 GO の GitHub を利用するヤツとか筋がいいように思うけど、現状においては具体案なし。

## 当面のプラン

* まずは TypeScript によるインタープリターあるいはコンパイラ(to JavaScript)作成し、Webブラウザおよび Node.js での実行を可能な形にし、試行錯誤を繰り返す。
* TypeScript ベースのインタープリターおよびコンパイラがある程度落ち着いてきたら、 &A 自身によるインタプリタおよびコンパイラ(to JavaScript)を作成する。
* 最初の実用途としては、現在思案中の Windows 向けスクリーンセーバー用のスクリプトとして適用する。このスクリーンセーバーは、Webブラウザ上でスクリプトの作成および動作確認ができるようにする予定。スクリーンセーバーとしての実動作時はC++によって記述されたインタプリターによって動作させる(気が向けば Xbyak を利用したJITコンパイラで動作させる)。画面描画ライブラリには Skia を利用し、Webブラウザでの動作確認時には Canvas 2D を利用する。
* 当面は将来性を重視し、互換性には目を瞑り卓袱台返しを繰り返す。

## 関数の360°実行について

x = add(a, b); と言った感じの加算する関数を add(a=, b) = x; あるいは add(a=, b=) = x; などと言った形で呼び出せる機能。この場合、前者では加算関数ではなく減算関数として機能し、後者は a と b の片割れが別途確定したら値が確定する関係情報が返る。また、この後者の a と b を利用して add を普通に呼び出せば x が返ってくるという機能。

仮にこの機能がうまく実現できれば、エンコード関数の類いを書くだけで、デコード側はエンコード関数を逆実行すれば良いだけなる。

かなり野心的な機能なので、頓挫する可能性大。


## ライセンス

Boost Software License - Version 1.0 を採用しています。
詳細は [.\LICENSE_1_0.txt](./LICENSE_1_0.txt) を参照してください。

日本語参考訳: http://hamigaki.sourceforge.jp/doc/html/license.html

## バージョン採番ルール

### バージョン表記のフォーマット

`A.BB.CCC`

### メジャーバージョン番号(`A`)

明らかな非互換の変更が行われた際にインクリメント。
桁数は不定。

### マイナーバージョン番号(`BB`)

機能追加や上位互換と判断できる仕様変更が行われた際にインクリメント。
桁数は2桁固定。

### ビルド番号(`CCC`)

バグフィックスや仕様変更というほどでもない微細な修正が行われた際にインクリ
メント。
桁数は3桁固定。

### 細則

* 各番号は0始まりとする。
* 固定桁に足りない場合は先頭を0埋めする。
* 番号が固定桁で足りなくなった場合は、上位の番号をインクリメントする。
* 上位の番号がインクリメントされた場合、下位の番号は0にリセットする。
