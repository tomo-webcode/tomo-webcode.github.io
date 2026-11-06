let isTransitioning = false; // 演出中の連打を防ぐ

// 白いフェードを最初から再生する
function playFlash() {
  const overlay = document.getElementById("flash-overlay");
  overlay.classList.remove("flash");
  void overlay.offsetWidth; // 再生をやり直すためのおまじない
  overlay.classList.add("flash");
  overlay.addEventListener(
    "animationend",
    () => overlay.classList.remove("flash"),
    { once: true },
  );
}

// シーンを切り替える
// effect: "turn"（振り向く）/ "approach"（近づく）/ "retreat"（下がる）/ 省略（すぐ切り替え）
function changeScene(sceneId, effect) {
  const current = document.querySelector(".scene-container.active");
  const next = document.getElementById(sceneId);
  if (!next || next === current || isTransitioning) return;

  // テーブルのシーン（scene-3）に入るときは、猫を座った状態に戻しておく
  if (sceneId === "scene-3") {
    const stage3 = next.querySelector(".scene-stage");
    if (stage3) stage3.classList.remove("cat-belly");
  }

  // 「動きを減らす」設定のPCでは演出なしで切り替える
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (effect && current && !reduceMotion) {
    isTransitioning = true;
    current.classList.add(`${effect}-from`);
    next.classList.add(`${effect}-to`);
    // ★ "turn-left" の時もフラッシュするように条件を追加します
    if (effect === "turn" || effect === "turn-left") playFlash();

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      next.removeEventListener("animationend", onEnd);
      current.classList.remove("active", `${effect}-from`);
      next.classList.remove(`${effect}-to`);
      next.classList.add("active");
      isTransitioning = false;
    };
    // 中の要素のアニメーション終了も届くので、次の場面本体のものだけ見る
    const onEnd = (e) => {
      if (e.target === next) finish();
    };
    next.addEventListener("animationend", onEnd);
    setTimeout(finish, 2000); // 念のための保険
    return;
  }

  // 演出なし
  document.querySelectorAll(".scene-container").forEach((scene) => {
    scene.classList.remove("active");
  });
  next.classList.add("active");
}

// 合言葉のチェック（正解なら本の画面へ）
async function checkPassword() {
  const input = prompt("秘密の本を開く合言葉を入力してください：");
  if (input === null || input === "") return;

  // 全角・半角や、大文字・小文字の違いは気にしない（スマホで打ちやすいように）
  const normalized = input.normalize("NFKC").trim().toUpperCase();
  // 正解のSHA-256ハッシュと照合（hideawaySha256 は index.html で定義）
  const hash = await hideawaySha256(normalized);
  if (
    hash === "4d5923b70078370fdb860f6b85bb6cf94d1d1506f04ca137d362558c459c32dd"
  ) {
    sessionStorage.setItem("hideaway_book_key", "ok");
    changeScene("scene-5", "approach");
  } else {
    alert("合言葉が違います。本は静かに閉じられたままです。");
  }
}

// data-scene を持つボタンを押したら、そのシーンへ移動
document.querySelectorAll("[data-scene]").forEach((button) => {
  button.addEventListener("click", () =>
    changeScene(button.dataset.scene, button.dataset.effect),
  );
});

// 本のボタン
document.getElementById("book-btn").addEventListener("click", checkPassword);

// 猫のボタン（クリックするたびに「座る ⇔ へそ天」を切り替える）
const catBtn = document.getElementById("cat-btn");
if (catBtn) {
  catBtn.addEventListener("click", () => {
    const stage = catBtn.closest(".scene-stage");
    const isBelly = stage.classList.toggle("cat-belly");
    catBtn.title = isBelly ? "猫を起こす" : "猫をなでる";
  });
}

// 画像の縦横比をステージに伝える（クリック範囲のずれ防止）
document.querySelectorAll(".scene-image").forEach((img) => {
  const applyRatio = () => {
    if (img.naturalWidth && img.naturalHeight) {
      img.parentElement.style.setProperty(
        "--ratio",
        img.naturalWidth / img.naturalHeight,
      );
    }
  };
  if (img.complete) {
    applyRatio();
  } else {
    img.addEventListener("load", applyRatio);
  }
});

// URLに #scene-4 などが付いている場合は、最初からそのシーンを開く
if (window.location.hash) {
  const targetId = window.location.hash.substring(1);
  // 本のシーンは、合言葉を通っていなければURLからは開かない
  const isLockedBook =
    targetId === "scene-5" &&
    sessionStorage.getItem("hideaway_book_key") !== "ok";
  if (document.getElementById(targetId) && !isLockedBook) {
    changeScene(targetId);
  }
}

// たまちゃんのダンス部屋の合言葉チェック
async function checkTamamiPassword() {
  const input = prompt("あなたの一番の推しの名前は？：");
  if (input === null || input === "") return;

  // 全角・半角や大文字・小文字を統一して判定しやすくする
  const normalized = input.normalize("NFKC").trim().toLowerCase();

  // 正解のSHA-256ハッシュ（hideawaySha256 は index.html で定義）
  const hash = await hideawaySha256(normalized);
  const allowedHashes = [
    "1259f2bbdd93c42241675d9433ab219213371c0c8f4a6f40c9a2a192a30ff090",
    "1162316e6063843bbdb6d768aa9d81b6b8f2bc28533b3553adf2adb2b0fa4164",
    "3b2d322c499f277d53c2955a14dd0d2f9b9ac2593639d8abc15237a3a4bd53e7",
    "473ec7ab1e08600fc028c71f335d7741d724301ab433d3e884319b204a510c0d",
  ];

  if (allowedHashes.includes(hash)) {
    sessionStorage.setItem("hideaway_dance_key", "ok");
    window.location.href = "dance.html";
  } else {
    alert("うーん、ちょっと違うみたい！もう一度考えてみてね。");
  }
}
